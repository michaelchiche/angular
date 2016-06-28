var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IS_DART, isBlank, CONST_EXPR } from 'angular2/src/facade/lang';
import { BaseException } from 'angular2/src/facade/exceptions';
import { ListWrapper } from 'angular2/src/facade/collection';
import { PromiseWrapper } from 'angular2/src/facade/async';
import { createHostComponentMeta, CompileIdentifierMetadata } from './compile_metadata';
import { Injectable } from 'angular2/src/core/di';
import { StyleCompiler } from './style_compiler';
import { ViewCompiler } from './view_compiler/view_compiler';
import { InjectorCompiler } from './view_compiler/injector_compiler';
import { TemplateParser } from './template_parser';
import { DirectiveNormalizer } from './directive_normalizer';
import { RuntimeMetadataResolver } from './runtime_metadata';
import { ComponentFactory } from 'angular2/src/core/linker/component_factory';
import { CompilerConfig } from './config';
import * as ir from './output/output_ast';
import { jitStatements } from './output/output_jit';
import { interpretStatements } from './output/output_interpreter';
import { InterpretiveAppViewInstanceFactory } from './output/interpretive_view';
import { InterpretiveInjectorInstanceFactory } from './output/interpretive_injector';
import { XHR } from './xhr';
/**
 * An internal module of the Angular compiler that begins with component types,
 * extracts templates, and eventually produces a compiled version of the component
 * ready for linking into an application.
 */
export let RuntimeCompiler = class RuntimeCompiler {
    constructor(_runtimeMetadataResolver, _templateNormalizer, _templateParser, _styleCompiler, _viewCompiler, _xhr, _injectorCompiler, _genConfig) {
        this._runtimeMetadataResolver = _runtimeMetadataResolver;
        this._templateNormalizer = _templateNormalizer;
        this._templateParser = _templateParser;
        this._styleCompiler = _styleCompiler;
        this._viewCompiler = _viewCompiler;
        this._xhr = _xhr;
        this._injectorCompiler = _injectorCompiler;
        this._genConfig = _genConfig;
        this._styleCache = new Map();
        this._hostCacheKeys = new Map();
        this._compiledTemplateCache = new Map();
        this._compiledTemplateDone = new Map();
    }
    createInjectorFactory(moduleClass, extraProviders = CONST_EXPR([])) {
        var injectorModuleMeta = this._runtimeMetadataResolver.getInjectorModuleMetadata(moduleClass, extraProviders);
        var compileResult = this._injectorCompiler.compileInjector(injectorModuleMeta);
        var factory;
        if (IS_DART || !this._genConfig.useJit) {
            factory = interpretStatements(compileResult.statements, compileResult.injectorFactoryVar, new InterpretiveInjectorInstanceFactory());
        }
        else {
            factory = jitStatements(`${injectorModuleMeta.type.name}.ngfactory.js`, compileResult.statements, compileResult.injectorFactoryVar);
        }
        return factory;
    }
    resolveComponent(componentType) {
        var compMeta = this._runtimeMetadataResolver.getDirectiveMetadata(componentType);
        var hostCacheKey = this._hostCacheKeys.get(componentType);
        if (isBlank(hostCacheKey)) {
            hostCacheKey = new Object();
            this._hostCacheKeys.set(componentType, hostCacheKey);
            assertComponent(compMeta);
            var hostMeta = createHostComponentMeta(compMeta.type, compMeta.selector);
            this._loadAndCompileComponent(hostCacheKey, hostMeta, [compMeta], [], []);
        }
        return this._compiledTemplateDone.get(hostCacheKey)
            .then((compiledTemplate) => new ComponentFactory(compMeta.selector, compiledTemplate.viewFactory, componentType));
    }
    clearCache() {
        this._styleCache.clear();
        this._compiledTemplateCache.clear();
        this._compiledTemplateDone.clear();
        this._hostCacheKeys.clear();
    }
    _loadAndCompileComponent(cacheKey, compMeta, viewDirectives, pipes, compilingComponentsPath) {
        var compiledTemplate = this._compiledTemplateCache.get(cacheKey);
        var done = this._compiledTemplateDone.get(cacheKey);
        if (isBlank(compiledTemplate)) {
            compiledTemplate = new CompiledTemplate();
            this._compiledTemplateCache.set(cacheKey, compiledTemplate);
            done =
                PromiseWrapper.all([this._compileComponentStyles(compMeta)].concat(viewDirectives.map(dirMeta => this._templateNormalizer.normalizeDirective(dirMeta))))
                    .then((stylesAndNormalizedViewDirMetas) => {
                    var normalizedViewDirMetas = stylesAndNormalizedViewDirMetas.slice(1);
                    var styles = stylesAndNormalizedViewDirMetas[0];
                    var parsedTemplate = this._templateParser.parse(compMeta, compMeta.template.template, normalizedViewDirMetas, pipes, compMeta.type.name);
                    var childPromises = [];
                    compiledTemplate.init(this._compileComponent(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises));
                    return PromiseWrapper.all(childPromises).then((_) => { return compiledTemplate; });
                });
            this._compiledTemplateDone.set(cacheKey, done);
        }
        return compiledTemplate;
    }
    _compileComponent(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises) {
        var compileResult = this._viewCompiler.compileComponent(compMeta, parsedTemplate, new ir.ExternalExpr(new CompileIdentifierMetadata({ runtime: styles })), pipes);
        compileResult.dependencies.forEach((dep) => {
            var childCompilingComponentsPath = ListWrapper.clone(compilingComponentsPath);
            var childCacheKey = dep.comp.type.runtime;
            var childViewDirectives = this._runtimeMetadataResolver.getViewDirectivesMetadata(dep.comp.type.runtime);
            var childViewPipes = this._runtimeMetadataResolver.getViewPipesMetadata(dep.comp.type.runtime);
            var childIsRecursive = ListWrapper.contains(childCompilingComponentsPath, childCacheKey);
            childCompilingComponentsPath.push(childCacheKey);
            var childComp = this._loadAndCompileComponent(dep.comp.type.runtime, dep.comp, childViewDirectives, childViewPipes, childCompilingComponentsPath);
            dep.factoryPlaceholder.runtime = childComp.proxyViewFactory;
            dep.factoryPlaceholder.name = `viewFactory_${dep.comp.type.name}`;
            if (!childIsRecursive) {
                // Only wait for a child if it is not a cycle
                childPromises.push(this._compiledTemplateDone.get(childCacheKey));
            }
        });
        var factory;
        if (IS_DART || !this._genConfig.useJit) {
            factory = interpretStatements(compileResult.statements, compileResult.viewFactoryVar, new InterpretiveAppViewInstanceFactory());
        }
        else {
            factory = jitStatements(`${compMeta.type.name}.template.js`, compileResult.statements, compileResult.viewFactoryVar);
        }
        return factory;
    }
    _compileComponentStyles(compMeta) {
        var compileResult = this._styleCompiler.compileComponent(compMeta);
        return this._resolveStylesCompileResult(compMeta.type.name, compileResult);
    }
    _resolveStylesCompileResult(sourceUrl, result) {
        var promises = result.dependencies.map((dep) => this._loadStylesheetDep(dep));
        return PromiseWrapper.all(promises)
            .then((cssTexts) => {
            var nestedCompileResultPromises = [];
            for (var i = 0; i < result.dependencies.length; i++) {
                var dep = result.dependencies[i];
                var cssText = cssTexts[i];
                var nestedCompileResult = this._styleCompiler.compileStylesheet(dep.sourceUrl, cssText, dep.isShimmed);
                nestedCompileResultPromises.push(this._resolveStylesCompileResult(dep.sourceUrl, nestedCompileResult));
            }
            return PromiseWrapper.all(nestedCompileResultPromises);
        })
            .then((nestedStylesArr) => {
            for (var i = 0; i < result.dependencies.length; i++) {
                var dep = result.dependencies[i];
                dep.valuePlaceholder.runtime = nestedStylesArr[i];
                dep.valuePlaceholder.name = `importedStyles${i}`;
            }
            if (IS_DART || !this._genConfig.useJit) {
                return interpretStatements(result.statements, result.stylesVar, new InterpretiveAppViewInstanceFactory());
            }
            else {
                return jitStatements(`${sourceUrl}.css.js`, result.statements, result.stylesVar);
            }
        });
    }
    _loadStylesheetDep(dep) {
        var cacheKey = `${dep.sourceUrl}${dep.isShimmed ? '.shim' : ''}`;
        var cssTextPromise = this._styleCache.get(cacheKey);
        if (isBlank(cssTextPromise)) {
            cssTextPromise = this._xhr.get(dep.sourceUrl);
            this._styleCache.set(cacheKey, cssTextPromise);
        }
        return cssTextPromise;
    }
};
RuntimeCompiler = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [RuntimeMetadataResolver, DirectiveNormalizer, TemplateParser, StyleCompiler, ViewCompiler, XHR, InjectorCompiler, CompilerConfig])
], RuntimeCompiler);
class CompiledTemplate {
    constructor() {
        this.viewFactory = null;
        this.proxyViewFactory = (viewUtils, childInjector, contextEl) => this.viewFactory(viewUtils, childInjector, contextEl);
    }
    init(viewFactory) { this.viewFactory = viewFactory; }
}
function assertComponent(meta) {
    if (!meta.isComponent) {
        throw new BaseException(`Could not compile '${meta.type.name}' because it is not a component.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZV9jb21waWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgteFJFckl6bkUudG1wL2FuZ3VsYXIyL3NyYy9jb21waWxlci9ydW50aW1lX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztPQUFPLEVBQ0wsT0FBTyxFQUdQLE9BQU8sRUFLUCxVQUFVLEVBQ1gsTUFBTSwwQkFBMEI7T0FDMUIsRUFBQyxhQUFhLEVBQWdCLE1BQU0sZ0NBQWdDO09BQ3BFLEVBQ0wsV0FBVyxFQUlaLE1BQU0sZ0NBQWdDO09BQ2hDLEVBQUMsY0FBYyxFQUFDLE1BQU0sMkJBQTJCO09BQ2pELEVBQ0wsdUJBQXVCLEVBTXZCLHlCQUF5QixFQUMxQixNQUFNLG9CQUFvQjtPQWdCcEIsRUFBQyxVQUFVLEVBQUMsTUFBTSxzQkFBc0I7T0FDeEMsRUFBQyxhQUFhLEVBQStDLE1BQU0sa0JBQWtCO09BQ3JGLEVBQUMsWUFBWSxFQUFDLE1BQU0sK0JBQStCO09BQ25ELEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxtQ0FBbUM7T0FDM0QsRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUI7T0FDekMsRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHdCQUF3QjtPQUNuRCxFQUFDLHVCQUF1QixFQUFDLE1BQU0sb0JBQW9CO09BQ25ELEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw0Q0FBNEM7T0FPcEUsRUFBQyxjQUFjLEVBQUMsTUFBTSxVQUFVO09BQ2hDLEtBQUssRUFBRSxNQUFNLHFCQUFxQjtPQUNsQyxFQUFDLGFBQWEsRUFBQyxNQUFNLHFCQUFxQjtPQUMxQyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sNkJBQTZCO09BQ3hELEVBQUMsa0NBQWtDLEVBQUMsTUFBTSw0QkFBNEI7T0FDdEUsRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQztPQUMzRSxFQUFDLEdBQUcsRUFBQyxNQUFNLE9BQU87QUFF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TUFBTSxJQUFJLGFBQWEsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLGtDQUFrQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBJU19EQVJULFxuICBUeXBlLFxuICBKc29uLFxuICBpc0JsYW5rLFxuICBpc1ByZXNlbnQsXG4gIGlzU3RyaW5nLFxuICBzdHJpbmdpZnksXG4gIGV2YWxFeHByZXNzaW9uLFxuICBDT05TVF9FWFBSXG59IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5pbXBvcnQge0Jhc2VFeGNlcHRpb24sIHVuaW1wbGVtZW50ZWR9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge1xuICBMaXN0V3JhcHBlcixcbiAgU2V0V3JhcHBlcixcbiAgTWFwV3JhcHBlcixcbiAgU3RyaW5nTWFwV3JhcHBlclxufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtQcm9taXNlV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9hc3luYyc7XG5pbXBvcnQge1xuICBjcmVhdGVIb3N0Q29tcG9uZW50TWV0YSxcbiAgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLFxuICBDb21waWxlVHlwZU1ldGFkYXRhLFxuICBDb21waWxlVGVtcGxhdGVNZXRhZGF0YSxcbiAgQ29tcGlsZVBpcGVNZXRhZGF0YSxcbiAgQ29tcGlsZU1ldGFkYXRhV2l0aFR5cGUsXG4gIENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGFcbn0gZnJvbSAnLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7XG4gIFRlbXBsYXRlQXN0LFxuICBUZW1wbGF0ZUFzdFZpc2l0b3IsXG4gIE5nQ29udGVudEFzdCxcbiAgRW1iZWRkZWRUZW1wbGF0ZUFzdCxcbiAgRWxlbWVudEFzdCxcbiAgQm91bmRFdmVudEFzdCxcbiAgQm91bmRFbGVtZW50UHJvcGVydHlBc3QsXG4gIEF0dHJBc3QsXG4gIEJvdW5kVGV4dEFzdCxcbiAgVGV4dEFzdCxcbiAgRGlyZWN0aXZlQXN0LFxuICBCb3VuZERpcmVjdGl2ZVByb3BlcnR5QXN0LFxuICB0ZW1wbGF0ZVZpc2l0QWxsXG59IGZyb20gJy4vdGVtcGxhdGVfYXN0JztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvZGknO1xuaW1wb3J0IHtTdHlsZUNvbXBpbGVyLCBTdHlsZXNDb21waWxlRGVwZW5kZW5jeSwgU3R5bGVzQ29tcGlsZVJlc3VsdH0gZnJvbSAnLi9zdHlsZV9jb21waWxlcic7XG5pbXBvcnQge1ZpZXdDb21waWxlcn0gZnJvbSAnLi92aWV3X2NvbXBpbGVyL3ZpZXdfY29tcGlsZXInO1xuaW1wb3J0IHtJbmplY3RvckNvbXBpbGVyfSBmcm9tICcuL3ZpZXdfY29tcGlsZXIvaW5qZWN0b3JfY29tcGlsZXInO1xuaW1wb3J0IHtUZW1wbGF0ZVBhcnNlcn0gZnJvbSAnLi90ZW1wbGF0ZV9wYXJzZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVOb3JtYWxpemVyfSBmcm9tICcuL2RpcmVjdGl2ZV9ub3JtYWxpemVyJztcbmltcG9ydCB7UnVudGltZU1ldGFkYXRhUmVzb2x2ZXJ9IGZyb20gJy4vcnVudGltZV9tZXRhZGF0YSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvZGVnZW5JbmplY3RvckZhY3Rvcnl9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9pbmplY3Rvcl9mYWN0b3J5JztcbmltcG9ydCB7XG4gIENvbXBvbmVudFJlc29sdmVyLFxuICBSZWZsZWN0b3JDb21wb25lbnRSZXNvbHZlclxufSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvY29tcG9uZW50X3Jlc29sdmVyJztcblxuaW1wb3J0IHtDb21waWxlckNvbmZpZ30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQge2ppdFN0YXRlbWVudHN9IGZyb20gJy4vb3V0cHV0L291dHB1dF9qaXQnO1xuaW1wb3J0IHtpbnRlcnByZXRTdGF0ZW1lbnRzfSBmcm9tICcuL291dHB1dC9vdXRwdXRfaW50ZXJwcmV0ZXInO1xuaW1wb3J0IHtJbnRlcnByZXRpdmVBcHBWaWV3SW5zdGFuY2VGYWN0b3J5fSBmcm9tICcuL291dHB1dC9pbnRlcnByZXRpdmVfdmlldyc7XG5pbXBvcnQge0ludGVycHJldGl2ZUluamVjdG9ySW5zdGFuY2VGYWN0b3J5fSBmcm9tICcuL291dHB1dC9pbnRlcnByZXRpdmVfaW5qZWN0b3InO1xuaW1wb3J0IHtYSFJ9IGZyb20gJy4veGhyJztcblxuLyoqXG4gKiBBbiBpbnRlcm5hbCBtb2R1bGUgb2YgdGhlIEFuZ3VsYXIgY29tcGlsZXIgdGhhdCBiZWdpbnMgd2l0aCBjb21wb25lbnQgdHlwZXMsXG4gKiBleHRyYWN0cyB0ZW1wbGF0ZXMsIGFuZCBldmVudHVhbGx5IHByb2R1Y2VzIGEgY29tcGlsZWQgdmVyc2lvbiBvZiB0aGUgY29tcG9uZW50XG4gKiByZWFkeSBmb3IgbGlua2luZyBpbnRvIGFuIGFwcGxpY2F0aW9uLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgUnVudGltZUNvbXBpbGVyIGltcGxlbWVudHMgQ29tcG9uZW50UmVzb2x2ZXIge1xuICBwcml2YXRlIF9zdHlsZUNhY2hlOiBNYXA8c3RyaW5nLCBQcm9taXNlPHN0cmluZz4+ID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8c3RyaW5nPj4oKTtcbiAgcHJpdmF0ZSBfaG9zdENhY2hlS2V5cyA9IG5ldyBNYXA8VHlwZSwgYW55PigpO1xuICBwcml2YXRlIF9jb21waWxlZFRlbXBsYXRlQ2FjaGUgPSBuZXcgTWFwPGFueSwgQ29tcGlsZWRUZW1wbGF0ZT4oKTtcbiAgcHJpdmF0ZSBfY29tcGlsZWRUZW1wbGF0ZURvbmUgPSBuZXcgTWFwPGFueSwgUHJvbWlzZTxDb21waWxlZFRlbXBsYXRlPj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9ydW50aW1lTWV0YWRhdGFSZXNvbHZlcjogUnVudGltZU1ldGFkYXRhUmVzb2x2ZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX3RlbXBsYXRlTm9ybWFsaXplcjogRGlyZWN0aXZlTm9ybWFsaXplcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfdGVtcGxhdGVQYXJzZXI6IFRlbXBsYXRlUGFyc2VyLCBwcml2YXRlIF9zdHlsZUNvbXBpbGVyOiBTdHlsZUNvbXBpbGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF92aWV3Q29tcGlsZXI6IFZpZXdDb21waWxlciwgcHJpdmF0ZSBfeGhyOiBYSFIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2luamVjdG9yQ29tcGlsZXI6IEluamVjdG9yQ29tcGlsZXIsIHByaXZhdGUgX2dlbkNvbmZpZzogQ29tcGlsZXJDb25maWcpIHt9XG5cbiAgY3JlYXRlSW5qZWN0b3JGYWN0b3J5KG1vZHVsZUNsYXNzOiBUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFQcm92aWRlcnM6IGFueVtdID0gQ09OU1RfRVhQUihbXSkpOiBDb2RlZ2VuSW5qZWN0b3JGYWN0b3J5PGFueT4ge1xuICAgIHZhciBpbmplY3Rvck1vZHVsZU1ldGEgPVxuICAgICAgICB0aGlzLl9ydW50aW1lTWV0YWRhdGFSZXNvbHZlci5nZXRJbmplY3Rvck1vZHVsZU1ldGFkYXRhKG1vZHVsZUNsYXNzLCBleHRyYVByb3ZpZGVycyk7XG4gICAgdmFyIGNvbXBpbGVSZXN1bHQgPSB0aGlzLl9pbmplY3RvckNvbXBpbGVyLmNvbXBpbGVJbmplY3RvcihpbmplY3Rvck1vZHVsZU1ldGEpO1xuICAgIHZhciBmYWN0b3J5OiBhbnk7XG4gICAgaWYgKElTX0RBUlQgfHwgIXRoaXMuX2dlbkNvbmZpZy51c2VKaXQpIHtcbiAgICAgIGZhY3RvcnkgPSBpbnRlcnByZXRTdGF0ZW1lbnRzKGNvbXBpbGVSZXN1bHQuc3RhdGVtZW50cywgY29tcGlsZVJlc3VsdC5pbmplY3RvckZhY3RvcnlWYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJwcmV0aXZlSW5qZWN0b3JJbnN0YW5jZUZhY3RvcnkoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZhY3RvcnkgPSBqaXRTdGF0ZW1lbnRzKGAke2luamVjdG9yTW9kdWxlTWV0YS50eXBlLm5hbWV9Lm5nZmFjdG9yeS5qc2AsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlUmVzdWx0LnN0YXRlbWVudHMsIGNvbXBpbGVSZXN1bHQuaW5qZWN0b3JGYWN0b3J5VmFyKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cblxuICByZXNvbHZlQ29tcG9uZW50KGNvbXBvbmVudFR5cGU6IFR5cGUpOiBQcm9taXNlPENvbXBvbmVudEZhY3Rvcnk+IHtcbiAgICB2YXIgY29tcE1ldGE6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSA9XG4gICAgICAgIHRoaXMuX3J1bnRpbWVNZXRhZGF0YVJlc29sdmVyLmdldERpcmVjdGl2ZU1ldGFkYXRhKGNvbXBvbmVudFR5cGUpO1xuICAgIHZhciBob3N0Q2FjaGVLZXkgPSB0aGlzLl9ob3N0Q2FjaGVLZXlzLmdldChjb21wb25lbnRUeXBlKTtcbiAgICBpZiAoaXNCbGFuayhob3N0Q2FjaGVLZXkpKSB7XG4gICAgICBob3N0Q2FjaGVLZXkgPSBuZXcgT2JqZWN0KCk7XG4gICAgICB0aGlzLl9ob3N0Q2FjaGVLZXlzLnNldChjb21wb25lbnRUeXBlLCBob3N0Q2FjaGVLZXkpO1xuICAgICAgYXNzZXJ0Q29tcG9uZW50KGNvbXBNZXRhKTtcbiAgICAgIHZhciBob3N0TWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhID1cbiAgICAgICAgICBjcmVhdGVIb3N0Q29tcG9uZW50TWV0YShjb21wTWV0YS50eXBlLCBjb21wTWV0YS5zZWxlY3Rvcik7XG5cbiAgICAgIHRoaXMuX2xvYWRBbmRDb21waWxlQ29tcG9uZW50KGhvc3RDYWNoZUtleSwgaG9zdE1ldGEsIFtjb21wTWV0YV0sIFtdLCBbXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb21waWxlZFRlbXBsYXRlRG9uZS5nZXQoaG9zdENhY2hlS2V5KVxuICAgICAgICAudGhlbigoY29tcGlsZWRUZW1wbGF0ZTogQ29tcGlsZWRUZW1wbGF0ZSkgPT4gbmV3IENvbXBvbmVudEZhY3RvcnkoXG4gICAgICAgICAgICAgICAgICBjb21wTWV0YS5zZWxlY3RvciwgY29tcGlsZWRUZW1wbGF0ZS52aWV3RmFjdG9yeSwgY29tcG9uZW50VHlwZSkpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpIHtcbiAgICB0aGlzLl9zdHlsZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZURvbmUuY2xlYXIoKTtcbiAgICB0aGlzLl9ob3N0Q2FjaGVLZXlzLmNsZWFyKCk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2xvYWRBbmRDb21waWxlQ29tcG9uZW50KGNhY2hlS2V5OiBhbnksIGNvbXBNZXRhOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdEaXJlY3RpdmVzOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGFbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZXM6IENvbXBpbGVQaXBlTWV0YWRhdGFbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsaW5nQ29tcG9uZW50c1BhdGg6IGFueVtdKTogQ29tcGlsZWRUZW1wbGF0ZSB7XG4gICAgdmFyIGNvbXBpbGVkVGVtcGxhdGUgPSB0aGlzLl9jb21waWxlZFRlbXBsYXRlQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICB2YXIgZG9uZSA9IHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVEb25lLmdldChjYWNoZUtleSk7XG4gICAgaWYgKGlzQmxhbmsoY29tcGlsZWRUZW1wbGF0ZSkpIHtcbiAgICAgIGNvbXBpbGVkVGVtcGxhdGUgPSBuZXcgQ29tcGlsZWRUZW1wbGF0ZSgpO1xuICAgICAgdGhpcy5fY29tcGlsZWRUZW1wbGF0ZUNhY2hlLnNldChjYWNoZUtleSwgY29tcGlsZWRUZW1wbGF0ZSk7XG4gICAgICBkb25lID1cbiAgICAgICAgICBQcm9taXNlV3JhcHBlci5hbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgWzxhbnk+dGhpcy5fY29tcGlsZUNvbXBvbmVudFN0eWxlcyhjb21wTWV0YSldLmNvbmNhdCh2aWV3RGlyZWN0aXZlcy5tYXAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpck1ldGEgPT4gdGhpcy5fdGVtcGxhdGVOb3JtYWxpemVyLm5vcm1hbGl6ZURpcmVjdGl2ZShkaXJNZXRhKSkpKVxuICAgICAgICAgICAgICAudGhlbigoc3R5bGVzQW5kTm9ybWFsaXplZFZpZXdEaXJNZXRhczogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsaXplZFZpZXdEaXJNZXRhcyA9IHN0eWxlc0FuZE5vcm1hbGl6ZWRWaWV3RGlyTWV0YXMuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlcyA9IHN0eWxlc0FuZE5vcm1hbGl6ZWRWaWV3RGlyTWV0YXNbMF07XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZFRlbXBsYXRlID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGVtcGxhdGVQYXJzZXIucGFyc2UoY29tcE1ldGEsIGNvbXBNZXRhLnRlbXBsYXRlLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkVmlld0Rpck1ldGFzLCBwaXBlcywgY29tcE1ldGEudHlwZS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIHZhciBjaGlsZFByb21pc2VzID0gW107XG4gICAgICAgICAgICAgICAgY29tcGlsZWRUZW1wbGF0ZS5pbml0KHRoaXMuX2NvbXBpbGVDb21wb25lbnQoY29tcE1ldGEsIHBhcnNlZFRlbXBsYXRlLCBzdHlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZXMsIGNvbXBpbGluZ0NvbXBvbmVudHNQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkUHJvbWlzZXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZVdyYXBwZXIuYWxsKGNoaWxkUHJvbWlzZXMpLnRoZW4oKF8pID0+IHsgcmV0dXJuIGNvbXBpbGVkVGVtcGxhdGU7IH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgIHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVEb25lLnNldChjYWNoZUtleSwgZG9uZSk7XG4gICAgfVxuICAgIHJldHVybiBjb21waWxlZFRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29tcGlsZUNvbXBvbmVudChjb21wTWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhLCBwYXJzZWRUZW1wbGF0ZTogVGVtcGxhdGVBc3RbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IHN0cmluZ1tdLCBwaXBlczogQ29tcGlsZVBpcGVNZXRhZGF0YVtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGluZ0NvbXBvbmVudHNQYXRoOiBhbnlbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFByb21pc2VzOiBQcm9taXNlPGFueT5bXSk6IEZ1bmN0aW9uIHtcbiAgICB2YXIgY29tcGlsZVJlc3VsdCA9IHRoaXMuX3ZpZXdDb21waWxlci5jb21waWxlQ29tcG9uZW50KFxuICAgICAgICBjb21wTWV0YSwgcGFyc2VkVGVtcGxhdGUsXG4gICAgICAgIG5ldyBpci5FeHRlcm5hbEV4cHIobmV3IENvbXBpbGVJZGVudGlmaWVyTWV0YWRhdGEoe3J1bnRpbWU6IHN0eWxlc30pKSwgcGlwZXMpO1xuICAgIGNvbXBpbGVSZXN1bHQuZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCkgPT4ge1xuICAgICAgdmFyIGNoaWxkQ29tcGlsaW5nQ29tcG9uZW50c1BhdGggPSBMaXN0V3JhcHBlci5jbG9uZShjb21waWxpbmdDb21wb25lbnRzUGF0aCk7XG5cbiAgICAgIHZhciBjaGlsZENhY2hlS2V5ID0gZGVwLmNvbXAudHlwZS5ydW50aW1lO1xuICAgICAgdmFyIGNoaWxkVmlld0RpcmVjdGl2ZXM6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YVtdID1cbiAgICAgICAgICB0aGlzLl9ydW50aW1lTWV0YWRhdGFSZXNvbHZlci5nZXRWaWV3RGlyZWN0aXZlc01ldGFkYXRhKGRlcC5jb21wLnR5cGUucnVudGltZSk7XG4gICAgICB2YXIgY2hpbGRWaWV3UGlwZXM6IENvbXBpbGVQaXBlTWV0YWRhdGFbXSA9XG4gICAgICAgICAgdGhpcy5fcnVudGltZU1ldGFkYXRhUmVzb2x2ZXIuZ2V0Vmlld1BpcGVzTWV0YWRhdGEoZGVwLmNvbXAudHlwZS5ydW50aW1lKTtcbiAgICAgIHZhciBjaGlsZElzUmVjdXJzaXZlID0gTGlzdFdyYXBwZXIuY29udGFpbnMoY2hpbGRDb21waWxpbmdDb21wb25lbnRzUGF0aCwgY2hpbGRDYWNoZUtleSk7XG4gICAgICBjaGlsZENvbXBpbGluZ0NvbXBvbmVudHNQYXRoLnB1c2goY2hpbGRDYWNoZUtleSk7XG5cbiAgICAgIHZhciBjaGlsZENvbXAgPVxuICAgICAgICAgIHRoaXMuX2xvYWRBbmRDb21waWxlQ29tcG9uZW50KGRlcC5jb21wLnR5cGUucnVudGltZSwgZGVwLmNvbXAsIGNoaWxkVmlld0RpcmVjdGl2ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRWaWV3UGlwZXMsIGNoaWxkQ29tcGlsaW5nQ29tcG9uZW50c1BhdGgpO1xuICAgICAgZGVwLmZhY3RvcnlQbGFjZWhvbGRlci5ydW50aW1lID0gY2hpbGRDb21wLnByb3h5Vmlld0ZhY3Rvcnk7XG4gICAgICBkZXAuZmFjdG9yeVBsYWNlaG9sZGVyLm5hbWUgPSBgdmlld0ZhY3RvcnlfJHtkZXAuY29tcC50eXBlLm5hbWV9YDtcbiAgICAgIGlmICghY2hpbGRJc1JlY3Vyc2l2ZSkge1xuICAgICAgICAvLyBPbmx5IHdhaXQgZm9yIGEgY2hpbGQgaWYgaXQgaXMgbm90IGEgY3ljbGVcbiAgICAgICAgY2hpbGRQcm9taXNlcy5wdXNoKHRoaXMuX2NvbXBpbGVkVGVtcGxhdGVEb25lLmdldChjaGlsZENhY2hlS2V5KSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGZhY3Rvcnk7XG4gICAgaWYgKElTX0RBUlQgfHwgIXRoaXMuX2dlbkNvbmZpZy51c2VKaXQpIHtcbiAgICAgIGZhY3RvcnkgPSBpbnRlcnByZXRTdGF0ZW1lbnRzKGNvbXBpbGVSZXN1bHQuc3RhdGVtZW50cywgY29tcGlsZVJlc3VsdC52aWV3RmFjdG9yeVZhcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBJbnRlcnByZXRpdmVBcHBWaWV3SW5zdGFuY2VGYWN0b3J5KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmYWN0b3J5ID0gaml0U3RhdGVtZW50cyhgJHtjb21wTWV0YS50eXBlLm5hbWV9LnRlbXBsYXRlLmpzYCwgY29tcGlsZVJlc3VsdC5zdGF0ZW1lbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZVJlc3VsdC52aWV3RmFjdG9yeVZhcik7XG4gICAgfVxuICAgIHJldHVybiBmYWN0b3J5O1xuICB9XG5cbiAgcHJpdmF0ZSBfY29tcGlsZUNvbXBvbmVudFN0eWxlcyhjb21wTWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHZhciBjb21waWxlUmVzdWx0ID0gdGhpcy5fc3R5bGVDb21waWxlci5jb21waWxlQ29tcG9uZW50KGNvbXBNZXRhKTtcbiAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZVN0eWxlc0NvbXBpbGVSZXN1bHQoY29tcE1ldGEudHlwZS5uYW1lLCBjb21waWxlUmVzdWx0KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc29sdmVTdHlsZXNDb21waWxlUmVzdWx0KHNvdXJjZVVybDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IFN0eWxlc0NvbXBpbGVSZXN1bHQpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdmFyIHByb21pc2VzID0gcmVzdWx0LmRlcGVuZGVuY2llcy5tYXAoKGRlcCkgPT4gdGhpcy5fbG9hZFN0eWxlc2hlZXREZXAoZGVwKSk7XG4gICAgcmV0dXJuIFByb21pc2VXcmFwcGVyLmFsbChwcm9taXNlcylcbiAgICAgICAgLnRoZW4oKGNzc1RleHRzKSA9PiB7XG4gICAgICAgICAgdmFyIG5lc3RlZENvbXBpbGVSZXN1bHRQcm9taXNlcyA9IFtdO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0LmRlcGVuZGVuY2llcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlcCA9IHJlc3VsdC5kZXBlbmRlbmNpZXNbaV07XG4gICAgICAgICAgICB2YXIgY3NzVGV4dCA9IGNzc1RleHRzW2ldO1xuICAgICAgICAgICAgdmFyIG5lc3RlZENvbXBpbGVSZXN1bHQgPVxuICAgICAgICAgICAgICAgIHRoaXMuX3N0eWxlQ29tcGlsZXIuY29tcGlsZVN0eWxlc2hlZXQoZGVwLnNvdXJjZVVybCwgY3NzVGV4dCwgZGVwLmlzU2hpbW1lZCk7XG4gICAgICAgICAgICBuZXN0ZWRDb21waWxlUmVzdWx0UHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlU3R5bGVzQ29tcGlsZVJlc3VsdChkZXAuc291cmNlVXJsLCBuZXN0ZWRDb21waWxlUmVzdWx0KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBQcm9taXNlV3JhcHBlci5hbGwobmVzdGVkQ29tcGlsZVJlc3VsdFByb21pc2VzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKG5lc3RlZFN0eWxlc0FycikgPT4ge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0LmRlcGVuZGVuY2llcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlcCA9IHJlc3VsdC5kZXBlbmRlbmNpZXNbaV07XG4gICAgICAgICAgICBkZXAudmFsdWVQbGFjZWhvbGRlci5ydW50aW1lID0gbmVzdGVkU3R5bGVzQXJyW2ldO1xuICAgICAgICAgICAgZGVwLnZhbHVlUGxhY2Vob2xkZXIubmFtZSA9IGBpbXBvcnRlZFN0eWxlcyR7aX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoSVNfREFSVCB8fCAhdGhpcy5fZ2VuQ29uZmlnLnVzZUppdCkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVycHJldFN0YXRlbWVudHMocmVzdWx0LnN0YXRlbWVudHMsIHJlc3VsdC5zdHlsZXNWYXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSW50ZXJwcmV0aXZlQXBwVmlld0luc3RhbmNlRmFjdG9yeSgpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGppdFN0YXRlbWVudHMoYCR7c291cmNlVXJsfS5jc3MuanNgLCByZXN1bHQuc3RhdGVtZW50cywgcmVzdWx0LnN0eWxlc1Zhcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRTdHlsZXNoZWV0RGVwKGRlcDogU3R5bGVzQ29tcGlsZURlcGVuZGVuY3kpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHZhciBjYWNoZUtleSA9IGAke2RlcC5zb3VyY2VVcmx9JHtkZXAuaXNTaGltbWVkID8gJy5zaGltJyA6ICcnfWA7XG4gICAgdmFyIGNzc1RleHRQcm9taXNlID0gdGhpcy5fc3R5bGVDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgIGlmIChpc0JsYW5rKGNzc1RleHRQcm9taXNlKSkge1xuICAgICAgY3NzVGV4dFByb21pc2UgPSB0aGlzLl94aHIuZ2V0KGRlcC5zb3VyY2VVcmwpO1xuICAgICAgdGhpcy5fc3R5bGVDYWNoZS5zZXQoY2FjaGVLZXksIGNzc1RleHRQcm9taXNlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNzc1RleHRQcm9taXNlO1xuICB9XG59XG5cbmNsYXNzIENvbXBpbGVkVGVtcGxhdGUge1xuICB2aWV3RmFjdG9yeTogRnVuY3Rpb24gPSBudWxsO1xuICBwcm94eVZpZXdGYWN0b3J5OiBGdW5jdGlvbjtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wcm94eVZpZXdGYWN0b3J5ID0gKHZpZXdVdGlscywgY2hpbGRJbmplY3RvciwgY29udGV4dEVsKSA9PlxuICAgICAgICB0aGlzLnZpZXdGYWN0b3J5KHZpZXdVdGlscywgY2hpbGRJbmplY3RvciwgY29udGV4dEVsKTtcbiAgfVxuXG4gIGluaXQodmlld0ZhY3Rvcnk6IEZ1bmN0aW9uKSB7IHRoaXMudmlld0ZhY3RvcnkgPSB2aWV3RmFjdG9yeTsgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRDb21wb25lbnQobWV0YTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKSB7XG4gIGlmICghbWV0YS5pc0NvbXBvbmVudCkge1xuICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGBDb3VsZCBub3QgY29tcGlsZSAnJHttZXRhLnR5cGUubmFtZX0nIGJlY2F1c2UgaXQgaXMgbm90IGEgY29tcG9uZW50LmApO1xuICB9XG59XG4iXX0=
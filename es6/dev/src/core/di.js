/**
 * @module
 * @description
 * The `di` module provides dependency injection container services.
 */
export { InjectMetadata, OptionalMetadata, InjectableMetadata, SelfMetadata, HostMetadata, SkipSelfMetadata, DependencyMetadata } from './di/metadata';
// we have to reexport * because Dart and TS export two different sets of types
export * from './di/decorators';
export { forwardRef, resolveForwardRef } from './di/forward_ref';
export { Injector, InjectorFactory } from './di/injector';
export { ReflectiveInjector } from './di/reflective_injector';
export { Binding, ProviderBuilder, bind, Provider, provide } from './di/provider';
export { ResolvedReflectiveFactory, ReflectiveDependency } from './di/reflective_provider';
export { ReflectiveKey } from './di/reflective_key';
export { NoProviderError, AbstractProviderError, CyclicDependencyError, InstantiationError, InvalidProviderError, NoAnnotationError, OutOfBoundsError } from './di/reflective_exceptions';
export { OpaqueToken } from './di/opaque_token';
export { MapInjector, MapInjectorFactory } from './di/map_injector';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLXhSRXJJem5FLnRtcC9hbmd1bGFyMi9zcmMvY29yZS9kaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBRUgsU0FDRSxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLGtCQUFrQixFQUNsQixZQUFZLEVBQ1osWUFBWSxFQUNaLGdCQUFnQixFQUNoQixrQkFBa0IsUUFDYixlQUFlLENBQUM7QUFFdkIsK0VBQStFO0FBQy9FLGNBQWMsaUJBQWlCLENBQUM7QUFFaEMsU0FBUSxVQUFVLEVBQUUsaUJBQWlCLFFBQXFCLGtCQUFrQixDQUFDO0FBRTdFLFNBQVEsUUFBUSxFQUFFLGVBQWUsUUFBTyxlQUFlLENBQUM7QUFDeEQsU0FBUSxrQkFBa0IsUUFBTywwQkFBMEIsQ0FBQztBQUM1RCxTQUNFLE9BQU8sRUFDUCxlQUFlLEVBQ2YsSUFBSSxFQUVKLFFBQVEsRUFDUixPQUFPLFFBQ0YsZUFBZSxDQUFDO0FBQ3ZCLFNBRUUseUJBQXlCLEVBQ3pCLG9CQUFvQixRQUdmLDBCQUEwQixDQUFDO0FBQ2xDLFNBQVEsYUFBYSxRQUFPLHFCQUFxQixDQUFDO0FBQ2xELFNBQ0UsZUFBZSxFQUNmLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIsa0JBQWtCLEVBQ2xCLG9CQUFvQixFQUNwQixpQkFBaUIsRUFDakIsZ0JBQWdCLFFBQ1gsNEJBQTRCLENBQUM7QUFDcEMsU0FBUSxXQUFXLFFBQU8sbUJBQW1CLENBQUM7QUFDOUMsU0FBUSxXQUFXLEVBQUUsa0JBQWtCLFFBQU8sbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBtb2R1bGVcbiAqIEBkZXNjcmlwdGlvblxuICogVGhlIGBkaWAgbW9kdWxlIHByb3ZpZGVzIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbnRhaW5lciBzZXJ2aWNlcy5cbiAqL1xuXG5leHBvcnQge1xuICBJbmplY3RNZXRhZGF0YSxcbiAgT3B0aW9uYWxNZXRhZGF0YSxcbiAgSW5qZWN0YWJsZU1ldGFkYXRhLFxuICBTZWxmTWV0YWRhdGEsXG4gIEhvc3RNZXRhZGF0YSxcbiAgU2tpcFNlbGZNZXRhZGF0YSxcbiAgRGVwZW5kZW5jeU1ldGFkYXRhXG59IGZyb20gJy4vZGkvbWV0YWRhdGEnO1xuXG4vLyB3ZSBoYXZlIHRvIHJlZXhwb3J0ICogYmVjYXVzZSBEYXJ0IGFuZCBUUyBleHBvcnQgdHdvIGRpZmZlcmVudCBzZXRzIG9mIHR5cGVzXG5leHBvcnQgKiBmcm9tICcuL2RpL2RlY29yYXRvcnMnO1xuXG5leHBvcnQge2ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmLCBGb3J3YXJkUmVmRm59IGZyb20gJy4vZGkvZm9yd2FyZF9yZWYnO1xuXG5leHBvcnQge0luamVjdG9yLCBJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vZGkvaW5qZWN0b3InO1xuZXhwb3J0IHtSZWZsZWN0aXZlSW5qZWN0b3J9IGZyb20gJy4vZGkvcmVmbGVjdGl2ZV9pbmplY3Rvcic7XG5leHBvcnQge1xuICBCaW5kaW5nLFxuICBQcm92aWRlckJ1aWxkZXIsXG4gIGJpbmQsXG5cbiAgUHJvdmlkZXIsXG4gIHByb3ZpZGVcbn0gZnJvbSAnLi9kaS9wcm92aWRlcic7XG5leHBvcnQge1xuICBSZXNvbHZlZFJlZmxlY3RpdmVCaW5kaW5nLFxuICBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LFxuICBSZWZsZWN0aXZlRGVwZW5kZW5jeSxcblxuICBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlclxufSBmcm9tICcuL2RpL3JlZmxlY3RpdmVfcHJvdmlkZXInO1xuZXhwb3J0IHtSZWZsZWN0aXZlS2V5fSBmcm9tICcuL2RpL3JlZmxlY3RpdmVfa2V5JztcbmV4cG9ydCB7XG4gIE5vUHJvdmlkZXJFcnJvcixcbiAgQWJzdHJhY3RQcm92aWRlckVycm9yLFxuICBDeWNsaWNEZXBlbmRlbmN5RXJyb3IsXG4gIEluc3RhbnRpYXRpb25FcnJvcixcbiAgSW52YWxpZFByb3ZpZGVyRXJyb3IsXG4gIE5vQW5ub3RhdGlvbkVycm9yLFxuICBPdXRPZkJvdW5kc0Vycm9yXG59IGZyb20gJy4vZGkvcmVmbGVjdGl2ZV9leGNlcHRpb25zJztcbmV4cG9ydCB7T3BhcXVlVG9rZW59IGZyb20gJy4vZGkvb3BhcXVlX3Rva2VuJztcbmV4cG9ydCB7TWFwSW5qZWN0b3IsIE1hcEluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9kaS9tYXBfaW5qZWN0b3InO1xuIl19
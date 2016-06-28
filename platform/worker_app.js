'use strict';"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var lang_1 = require('angular2/src/facade/lang');
var worker_app_common_1 = require('angular2/src/platform/worker_app_common');
var worker_app_1 = require('angular2/src/platform/worker_app');
var core_1 = require('angular2/core');
var worker_app_common_2 = require('angular2/src/platform/worker_app_common');
exports.WORKER_APP_PLATFORM = worker_app_common_2.WORKER_APP_PLATFORM;
exports.WORKER_APP_APPLICATION_COMMON = worker_app_common_2.WORKER_APP_APPLICATION_COMMON;
var worker_app_2 = require('angular2/src/platform/worker_app');
exports.WORKER_APP_APPLICATION = worker_app_2.WORKER_APP_APPLICATION;
var client_message_broker_1 = require('angular2/src/web_workers/shared/client_message_broker');
exports.ClientMessageBroker = client_message_broker_1.ClientMessageBroker;
exports.ClientMessageBrokerFactory = client_message_broker_1.ClientMessageBrokerFactory;
exports.FnArg = client_message_broker_1.FnArg;
exports.UiArguments = client_message_broker_1.UiArguments;
var service_message_broker_1 = require('angular2/src/web_workers/shared/service_message_broker');
exports.ReceivedMessage = service_message_broker_1.ReceivedMessage;
exports.ServiceMessageBroker = service_message_broker_1.ServiceMessageBroker;
exports.ServiceMessageBrokerFactory = service_message_broker_1.ServiceMessageBrokerFactory;
var serializer_1 = require('angular2/src/web_workers/shared/serializer');
exports.PRIMITIVE = serializer_1.PRIMITIVE;
__export(require('angular2/src/web_workers/shared/message_bus'));
var router_providers_1 = require('angular2/src/web_workers/worker/router_providers');
exports.WORKER_APP_ROUTER = router_providers_1.WORKER_APP_ROUTER;
function workerAppPlatform() {
    if (lang_1.isBlank(core_1.getPlatform())) {
        core_1.createPlatform(core_1.ReflectiveInjector.resolveAndCreate(worker_app_common_1.WORKER_APP_PLATFORM));
    }
    return core_1.assertPlatform(worker_app_common_1.WORKER_APP_PLATFORM_MARKER);
}
exports.workerAppPlatform = workerAppPlatform;
function bootstrapApp(appComponentType, customProviders) {
    var appInjector = core_1.ReflectiveInjector.resolveAndCreate([worker_app_1.WORKER_APP_APPLICATION, lang_1.isPresent(customProviders) ? customProviders : []], workerAppPlatform().injector);
    return core_1.coreLoadAndBootstrap(appInjector, appComponentType);
}
exports.bootstrapApp = bootstrapApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyX2FwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtY2lBb3NPa2QudG1wL2FuZ3VsYXIyL3BsYXRmb3JtL3dvcmtlcl9hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLHFCQUFpQywwQkFBMEIsQ0FBQyxDQUFBO0FBQzVELGtDQUdPLHlDQUF5QyxDQUFDLENBQUE7QUFDakQsMkJBQXFDLGtDQUFrQyxDQUFDLENBQUE7QUFDeEUscUJBU08sZUFBZSxDQUFDLENBQUE7QUFFdkIsa0NBR08seUNBQXlDLENBQUM7QUFGL0Msc0VBQW1CO0FBQ25CLDBGQUMrQztBQUNqRCwyQkFBcUMsa0NBQWtDLENBQUM7QUFBaEUscUVBQWdFO0FBQ3hFLHNDQUtPLHVEQUF1RCxDQUFDO0FBSjdELDBFQUFtQjtBQUNuQix3RkFBMEI7QUFDMUIsOENBQUs7QUFDTCwwREFDNkQ7QUFDL0QsdUNBSU8sd0RBQXdELENBQUM7QUFIOUQsbUVBQWU7QUFDZiw2RUFBb0I7QUFDcEIsMkZBQzhEO0FBQ2hFLDJCQUF3Qiw0Q0FBNEMsQ0FBQztBQUE3RCwyQ0FBNkQ7QUFDckUsaUJBQWMsNkNBQTZDLENBQUMsRUFBQTtBQUM1RCxpQ0FBZ0Msa0RBQWtELENBQUM7QUFBM0UsaUVBQTJFO0FBRW5GO0lBQ0UsRUFBRSxDQUFDLENBQUMsY0FBTyxDQUFDLGtCQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixxQkFBYyxDQUFDLHlCQUFrQixDQUFDLGdCQUFnQixDQUFDLHVDQUFtQixDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsTUFBTSxDQUFDLHFCQUFjLENBQUMsOENBQTBCLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBTGUseUJBQWlCLG9CQUtoQyxDQUFBO0FBRUQsc0JBQ0ksZ0JBQXNCLEVBQ3RCLGVBQXdEO0lBQzFELElBQUksV0FBVyxHQUFHLHlCQUFrQixDQUFDLGdCQUFnQixDQUNqRCxDQUFDLG1DQUFzQixFQUFFLGdCQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsZUFBZSxHQUFHLEVBQUUsQ0FBQyxFQUMzRSxpQkFBaUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQywyQkFBb0IsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBUGUsb0JBQVksZUFPM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aXNQcmVzZW50LCBpc0JsYW5rfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuaW1wb3J0IHtcbiAgV09SS0VSX0FQUF9QTEFURk9STSxcbiAgV09SS0VSX0FQUF9QTEFURk9STV9NQVJLRVJcbn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL3dvcmtlcl9hcHBfY29tbW9uJztcbmltcG9ydCB7V09SS0VSX0FQUF9BUFBMSUNBVElPTn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL3dvcmtlcl9hcHAnO1xuaW1wb3J0IHtcbiAgUGxhdGZvcm1SZWYsXG4gIFR5cGUsXG4gIENvbXBvbmVudFJlZixcbiAgUmVmbGVjdGl2ZUluamVjdG9yLFxuICBjb3JlTG9hZEFuZEJvb3RzdHJhcCxcbiAgZ2V0UGxhdGZvcm0sXG4gIGNyZWF0ZVBsYXRmb3JtLFxuICBhc3NlcnRQbGF0Zm9ybVxufSBmcm9tICdhbmd1bGFyMi9jb3JlJztcblxuZXhwb3J0IHtcbiAgV09SS0VSX0FQUF9QTEFURk9STSxcbiAgV09SS0VSX0FQUF9BUFBMSUNBVElPTl9DT01NT05cbn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL3dvcmtlcl9hcHBfY29tbW9uJztcbmV4cG9ydCB7V09SS0VSX0FQUF9BUFBMSUNBVElPTn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL3dvcmtlcl9hcHAnO1xuZXhwb3J0IHtcbiAgQ2xpZW50TWVzc2FnZUJyb2tlcixcbiAgQ2xpZW50TWVzc2FnZUJyb2tlckZhY3RvcnksXG4gIEZuQXJnLFxuICBVaUFyZ3VtZW50c1xufSBmcm9tICdhbmd1bGFyMi9zcmMvd2ViX3dvcmtlcnMvc2hhcmVkL2NsaWVudF9tZXNzYWdlX2Jyb2tlcic7XG5leHBvcnQge1xuICBSZWNlaXZlZE1lc3NhZ2UsXG4gIFNlcnZpY2VNZXNzYWdlQnJva2VyLFxuICBTZXJ2aWNlTWVzc2FnZUJyb2tlckZhY3Rvcnlcbn0gZnJvbSAnYW5ndWxhcjIvc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9zZXJ2aWNlX21lc3NhZ2VfYnJva2VyJztcbmV4cG9ydCB7UFJJTUlUSVZFfSBmcm9tICdhbmd1bGFyMi9zcmMvd2ViX3dvcmtlcnMvc2hhcmVkL3NlcmlhbGl6ZXInO1xuZXhwb3J0ICogZnJvbSAnYW5ndWxhcjIvc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9tZXNzYWdlX2J1cyc7XG5leHBvcnQge1dPUktFUl9BUFBfUk9VVEVSfSBmcm9tICdhbmd1bGFyMi9zcmMvd2ViX3dvcmtlcnMvd29ya2VyL3JvdXRlcl9wcm92aWRlcnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gd29ya2VyQXBwUGxhdGZvcm0oKTogUGxhdGZvcm1SZWYge1xuICBpZiAoaXNCbGFuayhnZXRQbGF0Zm9ybSgpKSkge1xuICAgIGNyZWF0ZVBsYXRmb3JtKFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFdPUktFUl9BUFBfUExBVEZPUk0pKTtcbiAgfVxuICByZXR1cm4gYXNzZXJ0UGxhdGZvcm0oV09SS0VSX0FQUF9QTEFURk9STV9NQVJLRVIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYm9vdHN0cmFwQXBwKFxuICAgIGFwcENvbXBvbmVudFR5cGU6IFR5cGUsXG4gICAgY3VzdG9tUHJvdmlkZXJzPzogQXJyYXk8YW55IC8qVHlwZSB8IFByb3ZpZGVyIHwgYW55W10qLz4pOiBQcm9taXNlPENvbXBvbmVudFJlZj4ge1xuICB2YXIgYXBwSW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShcbiAgICAgIFtXT1JLRVJfQVBQX0FQUExJQ0FUSU9OLCBpc1ByZXNlbnQoY3VzdG9tUHJvdmlkZXJzKSA/IGN1c3RvbVByb3ZpZGVycyA6IFtdXSxcbiAgICAgIHdvcmtlckFwcFBsYXRmb3JtKCkuaW5qZWN0b3IpO1xuICByZXR1cm4gY29yZUxvYWRBbmRCb290c3RyYXAoYXBwSW5qZWN0b3IsIGFwcENvbXBvbmVudFR5cGUpO1xufVxuIl19
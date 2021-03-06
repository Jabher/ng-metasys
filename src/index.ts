import 'reflect-metadata';

export * from './core/reflecton-types';
export {default as bootstrap} from './bootstrap/bootstrap';
export {default as Component} from './component/component-decorator';
export {
  modules,
  getMetadata,
  isComponent,
  isDirective,
  isFactory,
  isFilter,
  isModule,
  isProvider,
  isService
} from './core/reflection';
export {default as Directive} from './directive/directive-decorator';
export {default as Link} from './directive/link-decorator';
export {default as Inject} from './extensions/inject-decorator';
export {default as Bind} from './extensions/bind-decorator';
export {default as Transclude} from './extensions/transclude-decorator';
export {default as Filter} from './filter/filter-decorator';
export {default as Module} from './module/module-decorator';
export {default as Config} from './module/config-decorator';
export {default as Constant} from './module/constant-decorator';
export {default as Run} from './module/run-decorator';
export {default as Value} from './module/value-decorator';
export {default as Factory} from './providers/factory-decorator';
export {default as Provider} from './providers/provider-decorator';
export {default as Service} from './providers/service-decorator';

// Plugin System
export * from './plugin';

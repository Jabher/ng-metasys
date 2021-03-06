import * as angular from 'angular';
import * as tokens from '../core/tokens';
import {pluginRegistry, PluginRegistryItem} from '../core/plugin-registry';
import * as NgmsReflect from '../core/reflection';
import * as bootstrapComponent from '../component/bootstrap-component';
import * as bootstrapDirective from '../directive/bootstrap-directive';
import * as bootstrapFilter from '../filter/bootstrap-filter';
import * as bootstrapProviders from '../providers/bootstrap-providers';
import * as bootstrapModuleConfig from './bootstrap-module-config';
import bootstrapModule from './bootstrap-module';
import Module from './module-decorator';
import {ModuleMetadata} from './module-metadata';
import Config from './config-decorator';
import Value from './value-decorator';
import Constant from './constant-decorator';
import Run from './run-decorator';

class Bootstrapper {
  public bootstrapComponent = spyOn(bootstrapComponent, 'default');
  public bootstrapDirective = spyOn(bootstrapDirective, 'default');
  public bootstrapFilter = spyOn(bootstrapFilter, 'default');
  public bootstrapProviders = spyOn(bootstrapProviders, 'default');
  public bootstrapModuleConfig = spyOn(bootstrapModuleConfig, 'default');

  public ngModule = {
    name: 'TestModule',
    config: jasmine.createSpy('angular.IModule#config'),
    constant: jasmine.createSpy('angular.IModule#constant'),
    run: jasmine.createSpy('angular.IModule#run'),
    value: jasmine.createSpy('angular.IModule#value')
  };

  constructor() {
    this.bootstrapComponent.and.returnValue(null);
    this.bootstrapDirective.and.returnValue(null);
    this.bootstrapFilter.and.returnValue(null);
    this.bootstrapProviders.and.returnValue(null);
  }

  public unarm() {
    this.bootstrapModuleConfig.and.returnValue(null);
  }
}

describe('Function `bootstrapModule`', () => {
  class TestModule {
    public static value = 1;
    public static constant = 3;

    public static config() {
    }

    public static run() {
    }
  }

  let bootstrapper: Bootstrapper;
  let ngModuleFn: jasmine.Spy;

  beforeEach(() => {
    bootstrapper = new Bootstrapper();
    ngModuleFn = spyOn(angular, 'module');

    ngModuleFn.and.returnValue(bootstrapper.ngModule);
  });

  afterEach(() => {
    Reflect.deleteMetadata(tokens.module.self, TestModule.prototype);
    (NgmsReflect as any).modules = new Map();
  });

  it('should create bare module and write it to the `modules`', () => {
    Reflect.defineMetadata(tokens.module.self, {}, TestModule.prototype);

    bootstrapper.unarm();

    bootstrapModule(TestModule);

    expect(ngModuleFn).toHaveBeenCalledWith('TestModule', []);
    expect(NgmsReflect.modules.has('TestModule')).toBeTruthy();
  });

  it('should do nothing if module is already bootstrapped', () => {
    Reflect.defineMetadata(tokens.module.self, {}, TestModule.prototype);

    bootstrapper.unarm();

    bootstrapModule(TestModule);
    bootstrapModule(TestModule);

    expect(ngModuleFn.calls.count()).toEqual(1);
  });

  it('should throw an error if module declaration does not have a @Module mark', () => {
    expect(() => {
      class TestModuleError {
      }
      bootstrapModule(TestModuleError);
    }).toThrow();
  });

  it('should import dependency modules', () => {
    class DependencyModule {
    }
    const dependencyModule = {name: 'DependencyModule'};

    const imports = ['localStorageModule', 'ui.router', DependencyModule];

    Reflect.defineMetadata(tokens.module.self, {imports}, TestModule.prototype);
    Reflect.defineMetadata(tokens.module.self, {}, DependencyModule.prototype);

    bootstrapper.unarm();

    ngModuleFn.and.callFake(
      (name: string): any =>
        name === 'DependencyModule'
          ? dependencyModule
          : bootstrapper.ngModule
    );

    bootstrapModule(TestModule);

    expect(ngModuleFn).toHaveBeenCalledTimes(2);
    expect(ngModuleFn).toHaveBeenCalledWith('TestModule', [
      'localStorageModule',
      'ui.router',
      'DependencyModule'
    ]);
  });

  it('should initialize declarations', () => {
    class TestComponent {
    }
    class TestDirective {
    }
    class TestFilter {
    }

    Reflect.defineMetadata(tokens.component, null, TestComponent.prototype);
    Reflect.defineMetadata(tokens.directive, null, TestDirective.prototype);
    Reflect.defineMetadata(tokens.filter, null, TestFilter.prototype);

    const declarations = [TestComponent, TestDirective, TestFilter];

    Reflect.defineMetadata(tokens.module.self, {declarations}, TestModule.prototype);

    bootstrapper.unarm();

    bootstrapModule(TestModule);

    expect(bootstrapper.bootstrapComponent).toHaveBeenCalled();
    expect(bootstrapper.bootstrapDirective).toHaveBeenCalled();
    expect(bootstrapper.bootstrapFilter).toHaveBeenCalled();

    Reflect.deleteMetadata(tokens.component, TestComponent.prototype);
    Reflect.deleteMetadata(tokens.directive, TestDirective.prototype);
    Reflect.deleteMetadata(tokens.filter, TestFilter.prototype);
  });

  it('should throw an error if declaration does not have @Component, @Directive or @Filter mark',
    () => {
      class DeclarationWithoutMark {
      }
      const declarations = [DeclarationWithoutMark];

      Reflect.defineMetadata(tokens.module.self, {declarations}, TestModule.prototype);
      bootstrapper.unarm();

      expect(() => bootstrapModule(TestModule)).toThrow();
    });

  it('should initialize providers', () => {
    class TestProvider {
    }

    Reflect.defineMetadata(tokens.providers.provider, null, TestProvider.prototype);

    const providers = [TestProvider];

    Reflect.defineMetadata(tokens.module.self, {providers}, TestModule.prototype);

    bootstrapper.unarm();

    bootstrapModule(TestModule);

    expect(bootstrapper.bootstrapProviders).toHaveBeenCalled();

    Reflect.deleteMetadata(tokens.providers.provider, TestProvider.prototype);
  });

  describe('at module configuration', () => {
    const testModuleConfig = (token: symbol, type: string) => {
      Reflect.defineMetadata(token, type, TestModule);

      bootstrapper.bootstrapModuleConfig.and.returnValue([type]);

      bootstrapModule(TestModule);

      expect((bootstrapper.ngModule as any)[type]).toHaveBeenCalled();
      expect(bootstrapper.bootstrapModuleConfig).toHaveBeenCalled();
      expect(angular.module).toHaveBeenCalled();
    };

    beforeEach(() => {
      Reflect.defineMetadata(tokens.module.self, {}, TestModule.prototype);
    });

    afterEach(() => {
      Reflect.deleteMetadata(tokens.module.self, TestModule.prototype);
      Reflect.deleteMetadata(tokens.module.config, TestModule);
      Reflect.deleteMetadata(tokens.module.run, TestModule);
      Reflect.deleteMetadata(tokens.module.value, TestModule);
      Reflect.deleteMetadata(tokens.module.constant, TestModule);
    });

    it('should initialize `config`', () => {
      testModuleConfig(tokens.module.config, 'config');
      expect(bootstrapper.ngModule.config).toHaveBeenCalledWith(TestModule.config);
    });

    it('should initialize `run`', () => {
      testModuleConfig(tokens.module.run, 'run');
      expect(bootstrapper.ngModule.run).toHaveBeenCalledWith(TestModule.run);
    });

    it('should initialize `value`', () => {
      testModuleConfig(tokens.module.value, 'value');
      expect(bootstrapper.ngModule.value).toHaveBeenCalledWith('value', TestModule.value);
    });

    it('should initialize `constant`', () => {
      testModuleConfig(tokens.module.constant, 'constant');
      expect(bootstrapper.ngModule.constant).toHaveBeenCalledWith('constant', TestModule.constant);
    });
  });

  describe('at checking metadata for broken elements', () => {
    it('should check metadata imports', () => {
      Reflect.defineMetadata(tokens.module.self, {imports: [undefined]}, TestModule.prototype);

      expect(() => {
        bootstrapModule(TestModule);
      }).toThrowError('Module TestModule has broken import (one or more imports are undefined)');
    });

    it('should check metadata declarations', () => {
      Reflect.defineMetadata(tokens.module.self, {declarations: [undefined]}, TestModule.prototype);

      expect(() => {
        bootstrapModule(TestModule);
      }).toThrow();
    });

    it('should check metadata providers', () => {
      Reflect.defineMetadata(tokens.module.self, {providers: [undefined]}, TestModule.prototype);

      expect(() => {
        bootstrapModule(TestModule);
      }).toThrow();
    });
  });

  describe('at plugin system', () => {
    type Define = (token: symbol, declaration: any) => void;
    const define: Define =
      (token, declaration) =>
        Reflect.defineMetadata(token, {name: declaration.name}, declaration.prototype);

    let plugin: PluginRegistryItem;

    beforeEach(() => {
      Reflect.defineMetadata(tokens.module.self, {}, TestModule.prototype);
      bootstrapper.unarm();
    });

    afterEach(() => {
      pluginRegistry.length = 0;
      Reflect.deleteMetadata(tokens.module.self, TestModule.prototype);
    });

    it('should apply plugins for the declaration', () => {
      plugin = {
        bootstrap: jasmine.createSpy('PluginRegistryItem.bootstrap')
      };

      pluginRegistry.push(plugin);

      const moduleName = bootstrapModule(TestModule);

      expect(plugin.bootstrap).toHaveBeenCalledWith(angular.module(moduleName), TestModule);
      expect(plugin.bootstrap).toHaveBeenCalledTimes(1);
      expect((plugin.bootstrap as any).calls.mostRecent().args.length).toEqual(2);
    });

    it('should send injections names to the plugin bootstrap function', () => {
      class TestService {
      }
      class TestProvider {
      }
      class TestFilter {
      }
      class TestFactory {
      }

      define(tokens.permanent.service, TestService);
      define(tokens.permanent.provider, TestProvider);
      define(tokens.permanent.filter, TestFilter);
      define(tokens.permanent.factory, TestFactory);

      plugin = {
        bootstrap: jasmine.createSpy('PluginRegistryItem.bootstrap'),
        injections: [TestService, TestProvider, TestFilter, TestFactory]
      };

      pluginRegistry.push(plugin);

      const moduleName = bootstrapModule(TestModule);

      expect(plugin.bootstrap).toHaveBeenCalledWith(
        angular.module(moduleName),
        TestModule,
        'TestService',
        'TestProvider',
        'TestFilter',
        'TestFactory'
      );
    });

    it('should throw an error if metadata for required declaration is not exist', () => {
      class TestService {
      }

      plugin = {
        bootstrap: jasmine.createSpy('PluginRegistryItem.bootstrap'),
        injections: [TestService]
      };

      pluginRegistry.push(plugin);

      expect(() => bootstrapModule(TestModule))
        .toThrowError('Declaration TestService is not found in registry');
    });
  });
});

describe('Decorator `Module` and function `bootstrapModule`', () => {
  let bootstrapper: Bootstrapper;
  let ngModuleFn: jasmine.Spy;

  beforeEach(() => {
    bootstrapper = new Bootstrapper();
    ngModuleFn = spyOn(angular, 'module');
  });

  afterEach(() => {
    NgmsReflect.modules.clear();
  });

  it('should work together', () => {
    ngModuleFn.and.callThrough();

    @Module({})
    class DependencyModule {
    }

    const metadata: ModuleMetadata = {
      imports: ['localStorageModule', DependencyModule]
    };

    @Module(metadata)
    class TestModule {
    }

    bootstrapModule(TestModule);

    expect(ngModuleFn).toHaveBeenCalledWith('DependencyModule', []);
    expect(ngModuleFn)
      .toHaveBeenCalledWith('TestModule', ['localStorageModule', 'DependencyModule']);
  });

  it('should work together with `Config`, `Run`, `Value` and `Constant` decorators', () => {
    bootstrapper.bootstrapModuleConfig.and.callThrough();
    ngModuleFn.and.returnValue(bootstrapper.ngModule);

    @Module({})
    class TestModule {
      @Value public static value = 1;
      @Constant public static constant = 'testConst';

      @Config
      public static config() {
      }

      @Run
      public static run() {
      }
    }

    bootstrapModule(TestModule);

    expect(ngModuleFn).toHaveBeenCalledWith('TestModule', []);
    expect(bootstrapper.ngModule.value).toHaveBeenCalledWith('value', TestModule.value);
    expect(bootstrapper.ngModule.constant).toHaveBeenCalledWith('constant', TestModule.constant);
    expect(bootstrapper.ngModule.config).toHaveBeenCalledWith(TestModule.config);
    expect(bootstrapper.ngModule.run).toHaveBeenCalledWith(TestModule.run);
  });
});

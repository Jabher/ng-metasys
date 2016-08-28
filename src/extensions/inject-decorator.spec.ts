import {Inject} from './inject-decorator';

describe('Decorator `@Inject`', () => {
  class MockInject {
  }

  it('should inject data to the whole class (common injection)', () => {
    @Inject('$http', MockInject)
    class TestDeclaration {
    }

    const metadata = Reflect.getMetadata('ngms:inject', TestDeclaration.prototype);
    expect(metadata).toEqual(['$http', MockInject]);
  });

  it('should inject data to the methods of declaration (method inject)', () => {
    class TestDeclaration {
      @Inject('$http')
      public static config() {}

      @Inject(MockInject)
      public static run() {}
    }

    const metadata = Reflect.getMetadata('ngms:inject:method', TestDeclaration);
    expect(metadata).toEqual({config: ['$http'], run: [MockInject]});
  });

  it('should throw an error if method to inject is not static', () => {
    expect(() => {
      class TestDeclaration {
        @Inject('$http')
        public run() {}
      }
    }).toThrow();
  });

  it('should inject data to the properties of declaration (property inject)', () => {
    class TestDeclaration {
      @Inject('$q') public $q: any;
      @Inject(MockInject) public mockInject: any;
    }

    const metadata = Reflect.getMetadata('ngms:inject:property', TestDeclaration.prototype);
    expect(metadata).toEqual({$q: '$q', mockInject: MockInject});
  });

  it('should throw an error if property inject decorator contains more than one injection', () => {
    expect(() => {
      class TestDeclaration {
        @Inject('$http', '$q') public $http: any;
      }
    }).toThrow();
  });
});
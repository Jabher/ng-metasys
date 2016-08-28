export function Link(target: any, property: string, descriptor?: PropertyDescriptor) {
  if (!descriptor || (<any> descriptor).initializer) {
    throw new Error('@Link have to be applied to the static method');
  }

  Reflect.defineMetadata('ngms:directive:link', property, target);
}
import * as tokens from '../core/tokens';

type LinkDecorator = (target: any, property: string, descriptor?: PropertyDescriptor) => void;
const Link: LinkDecorator =
  (target, property, descriptor) => {
    if (!descriptor || (descriptor as any).initializer) {
      throw new Error('@Link have to be applied to the static method');
    }

    Reflect.defineMetadata(tokens.directive.link, property, target);
  };

export {LinkDecorator};
export default Link;

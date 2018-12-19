import lifecycleEventsMixin from './utils/lifecycleEventsMixin';
import GorillaError from './utils/Error';
import View from './View';
import SUPPORTED_DOM_EVENTS from './utils/supportedDOMEvents';

function Component(template, context, children) {
  // new로 생성된 인스턴스 객체의 this
  const that = this;
  
  that._element = null;
  that._view = new View(template, { context, children });
  // console.log(this._view);
  that._publish = lifecycleEventsMixin(that);
  // context 프로퍼티의 속성을 재정의 (getter & setter추가 됨), enumerable true이므로 수정가능상태
  for (let prop in context) {
    if (context.hasOwnProperty(prop)) {
      Object.defineProperties(that, {
        [prop]: {
          get: function () {
            return context[prop];
          },
          set: function (val) {
            //바뀐 값을 반영하고 render해 DOM에도 반영(render)
            that._view.context[prop] = val;
            that.render();
          },
          enumerable: true
        }
      });
    }
  }
}

// DOM 이벤트 달아주는 메소드
Component.prototype._initializeDOMEvents = function () {
  const elementEventsMap = [];
  const reg = new RegExp('^gorilla-');

  function findElementsWithGorillaAttr (element) {
    const attrs = element.attributes;

    for (let i = 0; i < attrs.length; i++) {
      if (reg.test(attrs[i].nodeName)) {
        const eventType = attrs[i].nodeName.split('-')[1];

        if (SUPPORTED_DOM_EVENTS.indexOf(eventType) === -1) {
          throw new GorillaError(`Unsupported event type: ${eventType}`);
        }

        elementEventsMap.push({
          element,
          eventType,
          eventHandler: attrs[i].nodeValue
        });

        break;
      }
    }

    if (element.children.length > 0) {
      for (let j = 0; j < element.children.length; j++) {
        if (!element.children[j].dataset.gorillaComponent) {
          findElementsWithGorillaAttr(element.children[j]);
        }
      }
    }
  }

  findElementsWithGorillaAttr(this._element);

  elementEventsMap.forEach(eventRegistrationData => {
    const eventType = eventRegistrationData.eventType;
    const targetElement = eventRegistrationData.element;
    const eventHandler = this[eventRegistrationData.eventHandler];

    if (typeof eventHandler !== 'function') {
      throw new GorillaError(`Cannot find method "${eventRegistrationData.eventHandler}" from the instance`);
    }

    targetElement.addEventListener(eventType, eventHandler);
  });
};

// DOM을 화면에 꽂아주는 메소드
Component.prototype.render = function () {
  this._publish("BEFORE_RENDER");
  this._element = this._view.render();
  this._initializeDOMEvents();

  setTimeout(() => {
    this._publish("AFTER_RENDER");
  }, 0);

  return this._element;
};

// 전체 삭제
Component.prototype.destroy = function () {
  this._publish("BEFORE_DESTROY");
  this._view.destroy();

  setTimeout(() => {
    this._publish("AFTER_DESTROY");
  }, 0);

  this._element = null;

  // TODO: remove event listeners from the element
};

export default Component;

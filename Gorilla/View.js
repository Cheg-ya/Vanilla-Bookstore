import domify from 'domify';
import GorillaError from './utils/Error';
import Component from './Component';

export default function View (template, options = {}) {
  // new로 생성된 인스턴스 객체의 this
  const that = this;
  // 초기화
  let element = null;
  const childRenderables = {};

  Object.defineProperties(that, {
    // `element` can be modified if `render()` is called again, so this is an accessor, not a data descriptor.
    element: { get: function () { return element; }, enumerable: true }
  });

  // 두번째 인자 ({ {context: what!}, {[grandBaby]} })
  that.context = options.context || {};
  that.children = options.children || {};

  // console.log(that.context,that.children);

  // 아래 메소드는 view에서 받은 정보로 HTML로 만들고 부모와 자식을 연결하는 메소드
  that.render = function () {
    const placeholders = {};

    for (let childName in that.children) {
      if (that.children.hasOwnProperty(childName)) {
        if (!(that.children[childName] instanceof Component)) {
          throw new GorillaError(`Child "${childName}" must be a gorilla component instance`);
        }

        // 아래 두 작업은 자식노드가 없는 경우 생략됨 (options.children === undefined)

        // childRenderables는 렌더된 자식 노드의 원본을 담고있는 객체 childRenderables[childName]는 자식노드의 원본 
        // -> new Gorilla.Component의 결과 Component {_element: p.grand, _view: View, on: ƒ, _publish: ƒ, …}
        // {grandBaby: p.grand}
        childRenderables[childName] = that.children[childName].render();
        // console.log(childRenderables[childName], childRenderables)
        // console.log(that.children[childName])

        // {grandBaby: "<div data-gorilla-target="grandBaby"></div>"} 1개의 프로퍼티
        // 자식노드가 될 div태그 생성 (더미태그)
        placeholders[childName] = `<div data-gorilla-target="${childName}"></div>`;
      }
    }
    // console.log(childRenderables, placeholders);

    // 자기 자신과 자식의 정보를 가지는 객체
    // {content: "What!!!"}
    // {name: "Baby..", grandBaby: "<div data-gorilla-target="grandBaby"></div>"}
    const templateData = Object.assign({}, that.context, placeholders);

    // null
    const oldElement = element;

    // tmeplateData 내용을 HTML 태그로 생성
    // <p class="grand" gorilla-click="hello" data-gorilla-component="grandBaby">What!!!</p>
    element = domify(template(templateData));
    
    if (element instanceof DocumentFragment) {
      throw new GorillaError('Gorilla component must be wrapped in a single element');
    }

    // 자식 노드가 있는 경우(grandbaby or baby)
    // 이 단계에서 element는 자식노드를 <div data-gorilla-target="grandBaby"></div> HTML태그 target상태로 가지고 있음
    // 자식노드의 target 상태를 원래 자식노드가 가지고 있는 정보로 바꿔주는 작업이 필요
    // childName = grandBaby / placeholders = {grandBaby: "<div data-gorilla-target="grandBaby"></div>"}
    for (let childName in placeholders) {
      if (placeholders.hasOwnProperty(childName)) {
        // 현재 target상태(div)의 정보를 저장
        const target = element.querySelector(`div[data-gorilla-target="${childName}"]`);
        
        // childRenderables는 렌더된 자식 노드의 원본을 담고있는 객체 childRenderables[childName]는 자식노드의 원본
        // 원본노드에 없었던 dataset 내용을 추가(data-gorilla-component = "grandBaby")
        childRenderables[childName].dataset.gorillaComponent = childName;
        
        // 더미와 원본을 바꿈
        // debugger;
        target.parentNode.replaceChild(childRenderables[childName], target);
      }
    }
    
    if (oldElement && oldElement.parentNode) {
      oldElement.parentNode.replaceChild(element, oldElement);
    }

    return element;
  };

  // element가 갖게 될 메소드 (노드 삭제)
  that.destroy = function () {
    if (!element || !element.parentNode) {
      throw new GorillaError("View elements must be in the DOM to be destroyed.");
    }

    element.parentNode.removeChild(element);

    element = null;
  };
}

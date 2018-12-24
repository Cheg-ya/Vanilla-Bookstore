// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// Importing component templates
import wrapperTemplate from 'wrapper.ejs';
import headerTemplate from 'header.ejs';
import sectionTemplate from 'section.ejs';
import footerTemplate from 'footer.ejs';
import pickUpTemplate from 'pickUpList.ejs';

// Import Gorilla Module
import Gorilla from '../Gorilla';;

let storage = { items: [], view: "list"};
let pickUpItem = { items: [] };
const pickUpCover = new Gorilla.Component(pickUpTemplate, pickUpItem);
const section = new Gorilla.Component(sectionTemplate, storage);
const header = new Gorilla.Component(headerTemplate, {});
const footer = new Gorilla.Component(footerTemplate, {});
const wrapper = new Gorilla.Component(wrapperTemplate, {}, {
  header,
  pickUpCover,
  section,
  footer
});

Gorilla.renderToDOM(wrapper, document.querySelector('body'));

const searchBox = document.getElementById('searchBox');
const searchButton = document.getElementsByClassName('glass')[0];
const bookContainer = document.getElementById('sectionContainer');
const listViewer = document.getElementById('list-view');
const cardViewer = document.getElementById('card-view');
const displayType = document.getElementsByClassName('displayType')[0];
const scrollUp = document.getElementsByClassName('scrollUp')[0];
const loadingEffect = document.getElementsByClassName('loading')[0];
const list = document.getElementsByClassName('listView');
const pickUpContainer = document.getElementById('pickUp');

let searchTarget;
let displayNumber = 10;
let onProgress = false;

searchButton.addEventListener('click', function (ev) {
  displayNumber = 10;
  ev.preventDefault();

  if (searchBox.value.length > 20 || searchBox.value.length === 0) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    throw new Error('글자수 제한 에러');
  }

  if (!onProgress) {
    if (storage.items.length) {
      storage.items = [];
    }

    searchTarget = searchBox.value;

    return searchAjax(searchTarget, displayNumber); 
  }

  alert('검색 결과 처리 중');
});

searchBox.addEventListener('keyup', function (ev) {
  displayNumber = 10;
  ev.preventDefault();

  if (ev.target.value.length > 20) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    throw new Error('글자수 제한');
  }

  if (ev.keyCode === 13) {
    if (ev.target.value.length === 0) {
      alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
      throw new Error('글자수 제한');
    }

    if (!onProgress) {
      if (storage.items.length) {
        storage.items = [];
      }

      searchTarget = ev.target.value;
      
      return searchAjax(searchTarget, displayNumber);
    }
    
    alert('검색 결과 처리 중');
  }
});

listViewer.addEventListener('click', function () {
  if (storage.view === "list") return;
  viewer(storage.items, "list");
});

cardViewer.addEventListener('click', function () {
  if (storage.view === "card") return;
  viewer(storage.items, "card");
});

scrollUp.addEventListener('click', toTheTop);

function toTheTop () {
  window.scroll({
    top: 0,
    behavior: 'smooth'
  });
}

document.addEventListener('scroll', infiniteScroll);

function infiniteScroll () {
  let scrollPosition = Math.round(window.scrollY);
  let bodyHeight = document.body.offsetHeight;
  let windowHeight = window.innerHeight;
  let reachBottom = bodyHeight - scrollPosition - windowHeight;

  if (reachBottom >= 0 && reachBottom < 20) {
    if (!onProgress) {
      displayNumber+= 20;
      searchAjax(searchTarget);
    }
  }
}

function searchAjax (input) {
  const request = new XMLHttpRequest();
  let target = input;
  
  loadingEffect.classList.remove('hide');
  loadingEffect.classList.add('visibility');
  onProgress = true;

  request.open('GET', 'http://localhost:3000/v1/search/book?query=' + target + '&start=' + displayNumber, true);
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      let originData = request.responseText;
      originData = JSON.parse(originData);

      let items = originData.items;
      let oldData = storage.items;

      if (!items.length) {
        setTimeout(() => {onProgress = false}, 1000);
        alert('검색 결과 없음');

        loadingEffect.classList.remove('visibility');
        loadingEffect.classList.add('hide');

        throw new Error('검색 결과 없음');
      }

      if (!oldData.length) {
        items.forEach(function (item) {
          item.title = item.title.split('(')[0].trim().split('<b>').join('').split('</b>').join('');
          item.author = item.author.split('<b>').join('').split('</b>').join('');
          item.description = item.description.split('<b>').join('').split('</b>').join('');
          item.pubdate = `${item.pubdate.slice(0,4)}년 ${item.pubdate.slice(4,6)}월 ${item.pubdate.slice(6)}일`;
        });

        let urlIdx = 0;

        urlAjax(items, urlIdx);

      } else if (oldData.length > 0) {
        let urlIdx = oldData.length;
        items = items.slice();

        items.forEach(function (item) {
          item.title = item.title.split('(')[0].trim().split('<b>').join('').split('</b>').join('');
          item.author = item.author.split('<b>').join('').split('</b>').join('');
          item.description = item.description.split('<b>').join('').split('</b>').join('');
          item.pubdate = `${item.pubdate.slice(0,4)}년 ${item.pubdate.slice(4,6)}월 ${item.pubdate.slice(6)}일`;
        });

        let newData = oldData.concat(items);

        urlAjax(newData, urlIdx);
      }
    }
  }

  request.send(null);
}

function urlAjax (data, idx) {
  let items = data;
  let urlRequest = new XMLHttpRequest();

  urlRequest.open('GET', 'http://localhost:3000/v1/util/shorturl?url=' + items[idx].link, true);
  urlRequest.onreadystatechange = function () {
    if (urlRequest.readyState === 4 && urlRequest.status === 200) {
      let url = urlRequest.responseText;
      url = JSON.parse(url);
      items[idx].url = url.result.url;

      if (idx === items.length - 1 && !bookContainer.children.length) {
        setTimeout(() => {
          onProgress = false;
        }, 1000);

        if (storage.view === "list") {
          return viewer(data, "list");
        }

        return viewer(data, "card");
      }

      idx++;

      urlAjax(items, idx);
    }
  }

  urlRequest.send(null);
}

function viewer (data, type) {
  if (type === "list") {
    storage["view"] = type;

  } else if (type === "card") {
    storage["view"] = type;
  }

  storage["items"] = data;

  if (displayType.classList.contains('hide')) {
    displayType.classList.remove('hide');
    displayType.classList.add('visibility');
    scrollUp.classList.remove('hide');
    scrollUp.classList.add('visibility');
  }

  if (!loadingEffect.classList.contains('hide')) {
    loadingEffect.classList.remove('visibility');
    loadingEffect.classList.add('hide');
  }

  section.render();

  if (type === "list") {
    window.scroll(0, window.scrollY-2006);

  } else {
    window.scroll(0, window.scrollY-751);
  }

  for (let i = 0; i < list.length; i++) {
    if (type === 'list') {
      list[i].addEventListener('click', function (ev) {
        let idx = Number(ev.currentTarget.id);
        
        if (!pickUpItem.items.includes(data[idx-1])) {
          pickUpItem.items.unshift(data[idx-1]);
          pickUpCover.render();
        }
      });
    }
  }
}

/* DO NOT REMOVE */
module.hot.accept();
/* DO NOT REMOVE */

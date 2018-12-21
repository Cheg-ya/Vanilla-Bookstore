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
import loadingTemplate from 'loading.ejs';

// Import Gorilla Module
import Gorilla from '../Gorilla';;

let storage = { items: [], view: "list",};
let section = new Gorilla.Component(sectionTemplate, storage);
const header = new Gorilla.Component(headerTemplate);
const footer = new Gorilla.Component(footerTemplate);
const wrapper = new Gorilla.Component(wrapperTemplate, {}, {
  header,
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

let searchTarget;
let loading;
let displayNumber = 10;
let onProgress = false;
let list = "list";
let card = "card";

searchButton.addEventListener('click', function (ev) {
  displayNumber = 10;
  ev.preventDefault();

  if (searchBox.value.length > 20 || searchBox.value.length === 0) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    throw new Error('글자수 제한 에러');
  }

  if (!onProgress) {
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
      searchTarget = ev.target.value;
      return searchAjax(searchTarget, displayNumber);
    }
    
    alert('검색 결과 처리 중');
  }
});

listViewer.addEventListener('click', function (ev) {
  if (storage.view === "list") return;
  viewer(storage.items, list);
});

cardViewer.addEventListener('click', function (ev) {
  if (storage.view === "card") return;
  viewer(storage.items, card);
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

  // console.log(bodyHeight- scrollPosition- windowHeight);

  if (bodyHeight - scrollPosition - windowHeight === 0) {
    window.scroll(0, scrollPosition - 10);

    if (!onProgress) {
      displayNumber+= 20;

      if (displayNumber >= 100) {
        alert("검색 결과는 최대 100개 이하 입니다.");
        throw new Error('검색 결과 한도 초과');
      }

      searchAjax(searchTarget);
    }

    // alert('검색 결과 처리 중');
  }
}

function searchAjax (input) {
  loading = new Gorilla.Component(loadingTemplate, {});
  Gorilla.renderToDOM(loading, document.querySelector('footer'));
  const request = new XMLHttpRequest();
  let target = input;
  let urlIdx = 0;
  onProgress = true;

  request.open('GET', 'http://localhost:3000/v1/search/book?query=' + target + '&display=' + displayNumber, true);
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      let originData = request.responseText;
      originData = JSON.parse(originData);
      let items = originData.items;

      if (!items.length) {
        setTimeout(() => {onProgress = false}, 2000);
        alert('검색 결과 없음');

        throw new Error('검색 결과 없음');
      }

      items.forEach(function (item) {
        item.title = item.title.split('(')[0].trim().split('<b>').join('').split('</b>').join('');
        item.author = item.author.split('<b>').join('').split('</b>').join('');
        item.description = item.description.split('<b>').join('').split('</b>').join('');
        item.pubdate = `${item.pubdate.slice(0,4)}년 ${item.pubdate.slice(4,6)}월 ${item.pubdate.slice(6)}일`;
      });

      urlAjax(items, urlIdx);
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

      if (idx === data.length - 1 && bookContainer.children.length === 0) {
        setTimeout(() => {onProgress = false}, 1000);

        if (storage.view === list) {
          return viewer(data, list);
        }

        return viewer(data, card);
      }
      
      idx++;

      urlAjax(items, idx);
    }
  }

  urlRequest.send(null);
}

function viewer (data, type) {
  bookContainer.innerHTML= '';

  if (type === list) {
    storage["view"] = list;

  } else if (type === card) {
    storage["view"] = card;
  }

  storage["items"] = data;

  section.render();
  loading.destroy();

  if (displayType.classList.contains('hide')) {
    displayType.classList.remove('hide');
    displayType.classList.add('visibility');
    scrollUp.classList.remove('hide');
    scrollUp.classList.add('visibility');
  }
}

/* DO NOT REMOVE */
module.hot.accept();
/* DO NOT REMOVE */

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
const glass = document.getElementsByClassName('glass')[0];
const bookContainer = document.getElementById('sectionContainer');
const listView = document.getElementById('list-view');
const cardView = document.getElementById('card-view');
const more = document.getElementById('button');

let text;
let displayNumber = 10;
let urlIdx = 0;

listView.addEventListener('click', function () {
  if (!storage.items.length) return;
  listViewer(storage.items);
});

cardView.addEventListener('click', function () {
  if (!storage.items.length) return;
  cardViewer(storage.items);
});

more.addEventListener('click', function () {
  displayNumber+= 10;
  
  if (displayNumber > 100) {
    alert("검색 결과는 최대 100개 이하 입니다.");
    throw new Error('검색 결과 한도 초과');
  }

  searchAjax(text);
});

glass.addEventListener('click', function (ev) {
  displayNumber = 10;
  ev.preventDefault();

  if (searchBox.value.length > 20) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    throw new Error('글자수 제한 에러');
  }

  text = searchBox.value;
  searchAjax(text, displayNumber);
});

searchBox.addEventListener('keyup', function (ev) {
  displayNumber = 10;
  ev.preventDefault();

  if (ev.target.value.length > 20) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    throw new Error('글자수 제한 에러');
  }

  if (ev.keyCode === 13) {
    if (ev.target.value.length === 0) {
      alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
      throw new Error('글자수 제한 에러');
    }

    text = ev.target.value;
    searchAjax(text, displayNumber);
  }
});

function searchAjax (input) {
  let request = new XMLHttpRequest();
  let target = input;
  urlIdx = 0;

  request.open('GET', 'http://localhost:3000/v1/search/book?query='+ target +'&display=' + displayNumber, true);

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      let originData = request.responseText;
      originData = JSON.parse(originData);

      if (!originData.items.length) {
        alert('검색 결과 없음');
        throw new Error('결과 없음');
      }

      for (let i = 0; i < originData.items.length; i++) {
        originData.items[i].title = originData.items[i].title.split('<b>').join('').split('</b>').join('');
        originData.items[i].author = originData.items[i].author.split('<b>').join('').split('</b>').join('');
        originData.items[i].description = originData.items[i].description.split('<b>').join('').split('</b>').join('');
        originData.items[i].pubdate = `${originData.items[i].pubdate.slice(0,4)}년 ${originData.items[i].pubdate.slice(4,6)}월 ${originData.items[i].pubdate.slice(6)}일`;
      }

      urlAjax(originData.items)
      
    } else if (request.readyState === 4 && request.status === 404){
      alert('서버에 자료 없음');
      throw new Error('404 Not found');
    }
  }

  request.send(null);
}

function urlAjax (data) {
  let items = data;
  let urlRequest = new XMLHttpRequest();

  urlRequest.open('GET', 'http://localhost:3000/v1/util/shorturl?url=' + items[urlIdx].link, true);

  urlRequest.onreadystatechange = function () {
    if (urlRequest.readyState === 4 && urlRequest.status === 200) {
      let url = urlRequest.responseText;
      url = JSON.parse(url);

      items[urlIdx].url = url.result.url;

      if (urlIdx === displayNumber-1 && !bookContainer.children.length) {
        if (storage.view === "list") {
          return listViewer(data);
        }
        
        return cardViewer(data);
      }

      urlIdx++;

      urlAjax(items);
    }
  }

  urlRequest.send(null);
}

function cardViewer (data) {
  bookContainer.innerHTML= '';

  data.forEach(function (v) {
    if (v.title.includes('(')) {
      v.title = v.title.split('(')[0].trim();
    }
  });
  // 저자 2명이상 일때 ... 외 1명
  for (let i = 0; i < data.length; i++) {
    if (!data[i].description) {
      data[i].description = "누락된 데이터";
    }
  }

  storage["items"] = data;
  storage["view"] = "card";
  section.render();

  if (more.classList.contains('hide')) {
    more.classList.remove('hide');
    more.classList.add('visibility');
  }
}

function listViewer (data) {
  bookContainer.innerHTML= '';

  for (let i = 0; i < data.length; i++) {
    if (!data[i].description) {
      data[i].description = "누락된 데이터";
    }
  }

  storage["items"] = data;
  storage["view"] = "list";
  section.render();

  if (more.classList.contains('hide')) {
    more.classList.remove('hide');
    more.classList.add('visibility');
  }
}

/* DO NOT REMOVE */
module.hot.accept();
/* DO NOT REMOVE */

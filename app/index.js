// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// Importing component templates
import listTemplate from 'listView.ejs';
import cardTemplate from 'cardView.ejs';
import headerTemplate from 'header.ejs';
import sectionTemplate from 'section.ejs';
import footerTemplate from 'footer.ejs';
import sectionBody from 'sectionParent.ejs';

// Import Gorilla Module
import Gorilla from '../Gorilla';

const footer = new Gorilla.Component(footerTemplate);
const section = new Gorilla.Component(sectionTemplate);
const header = new Gorilla.Component(headerTemplate);

Gorilla.renderToDOM(header, document.querySelector('#wrapper'));
Gorilla.renderToDOM(section, document.querySelector('#wrapper'));
Gorilla.renderToDOM(footer, document.querySelector('#wrapper'));

const searchBox = document.getElementsByClassName('searchBox')[0];
const bookContainer = document.getElementById('sectionContainer');
const listView = document.getElementById('list-view');
const cardView = document.getElementById('card-view');

searchBox.addEventListener('keyup', function (ev) {

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

    let text = ev.target.value;
    ajax(text);
  }
});

function ajax (input) {
  let request = new XMLHttpRequest();
  let target = input

  request.open('GET', 'http://localhost:3000/v1/search/book?query='+ target +'&display=20', true);
  
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
      // debugger;
      if (!bookContainer.children.length) {
        listViewer(originData, bookContainer);   

        console.log(originData.items);

        listView.addEventListener('click', function () {
          listViewer(originData, bookContainer);
        });

        cardView.addEventListener('click', function () {
          cardViewer(originData, bookContainer);
        });
      } else {
        //기존 컴포넌트의 데이터만 바꾸기
      }

    } else if (request.readyState === 4 && request.status === 404){
      alert('서버에 자료 없음');
      throw new Error('404 Not found');
    }
  }
  request.send(null);
}

function cardViewer (data, container) {
  bookContainer.innerHTML= '';

  data.items.forEach(function (v) {
    if (v.title.includes('(')) {
      v.title = v.title.split('(')[0].trim();
      return v.title;
    }
  })

  console.log(data);

  let bookCase = {};

  for (let i = 0; i < 20; i++) {
    if (data.items[i].description) {
      data.items[i].description = data.items[i].description.slice(0, 50) + "...";
    } else {
      data.items[i].description = "설명 누락 정보";
    }

    bookCase["book" + (i + 1)] = new Gorilla.Component(cardTemplate, data.items[i]);
  }

  let sectionParent = new Gorilla.Component(sectionBody, {}, bookCase);
  Gorilla.renderToDOM(sectionParent, container);

  for (let j = 0; j < 20; j++) {
    let bookImage = container.getElementsByClassName('cardBookCover')[j];
    bookImage.setAttribute('src', bookCase["book" + (j + 1)].image);
  }
}

function listViewer (data, container) {
  bookContainer.innerHTML= '';

  let bookCase = {};

  for (let i = 0; i < 20; i++) {
    if (data.items[i].description) {
      data.items[i].description = data.items[i].description.slice(0, 50) + "...";

    } else {
      data.items[i].description = "누락된 정보";
    }

    bookCase["book" + (i + 1)] = new Gorilla.Component(listTemplate, data.items[i]);
  }

  let sectionParent = new Gorilla.Component(sectionBody, {}, bookCase);
  Gorilla.renderToDOM(sectionParent, container);

  for (let j = 0; j < 20; j++) {
    let bookImage = container.getElementsByClassName('listBookCover')[j];
    bookImage.setAttribute('src', bookCase["book" + (j + 1)].image);
  }
}

/* DO NOT REMOVE */
module.hot.accept();
/* DO NOT REMOVE */

// Listening to component life cycle
// app.on('BEFORE_RENDER', () => console.log('app before render'));
// app.on('AFTER_RENDER', () => console.log('app after render'));

// Updating component data model //스크롤 다내렸을때 20개 다시 자동으로 불러오는 기능?
// setTimeout(() => {
//   app.title = '빠닐라코띵';
//   baby.name = 'Qkqkqkqk';
//   grandBaby.content = 'GGGGG';
// }, 2000);

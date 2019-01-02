// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// Importing component templates
import wrapperTemplate from 'wrapper.ejs';
import headerTemplate from 'app.ejs';
import sectionTemplate from 'section.ejs';

// Import Gorilla Module
import Gorilla from '../Gorilla';

const requestAPI = {
  displayNumber: 1,
  reqeustOnProgress: false,

  getBooks(query) {
    const that = this;

    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      const adress = `http://localhost:3000/v1/search/book?query=${query}&start=${that.displayNumber}`;

      xhr.open('GET', adress, true)
      xhr.responseType = 'json';
      xhr.onload = function () {
        setTimeout(function () {
          that.reqeustOnProgress = false;
        } ,2000)

        app.loadingOn = 'hide';

        if (!xhr.response.items.length) {
          alert('검색 결과 없음');
          return;
        }

        resolve(xhr.response);
      }

      xhr.onError = function () {
        reject("서버 에러발생");
      }

      xhr.send();

    }).then(function recursivePromise(res) {
      const result = [];

      for (let i = 0; i < res.items.length; i++) {
        result.push(new Promise(function (resolve) {
          const urlXhr = new XMLHttpRequest();
          const url = `http://localhost:3000/v1/util/shorturl?url=${res.items[i].link}`;
      
          urlXhr.open('GET', url, true)
          urlXhr.responseType = 'json';

          urlXhr.onload = function () {
            const itemUrl = urlXhr.response.result.url;
            
            res.items[i].url = itemUrl;
            resolve(res.items[i]);
          }

          urlXhr.onError = function () {
            reject("URL 서버 에러발생");
          }

          urlXhr.send();
        }));
      }

      return Promise.all(result);

    }).then(function (res) {
      res.forEach(function (item) {
          item.title = item.title.split('(')[0].trim().split('<b>').join('').split('</b>').join('');
          item.author = item.author.split('<b>').join('').split('</b>').join('');
          item.description = item.description.split('<b>').join('').split('</b>').join('');
          item.pubdate = `${item.pubdate.slice(0,4)}년 ${item.pubdate.slice(4,6)}월 ${item.pubdate.slice(6)}일`;
      });

      return res;
    });
  }
}

const section = new Gorilla.Component(sectionTemplate, {
   items: [],
   displayType: 'list'
});

const app = new Gorilla.Component(headerTemplate, {
  searchValue: '',
  loadingOn: 'hide'
});

app.onInputChange = function (ev) {
  if (ev.keyCode === 13) {
    if (requestAPI.reqeustOnProgress) {
      alert('검색 결과 처리중 2초 후 다시시도');
      return;
    }

    if (ev.target.value.length > 20 || ev.target.value.length === 0) {
      alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
      ev.target.value = '';
      return;
    }
    
    if (section.items.length > 0) {
      section.items = [];
    }

    app.searchValue = ev.target.value;
    app.loadingOn = 'visibility';
    requestAPI.reqeustOnProgress = true;
  
    requestAPI.getBooks(app.searchValue).then(function (items) {
      if (!section.items.length) {
        section.items = items;
      } else {
        section.items = section.items.concat(items);
      }
    });
  }
}

app.onSearchClick = function () {
  if (!app.searchValue.length || app.searchValue.length > 20) {
    alert('검색어는 1글자 이상 20글자 이하 (공백 포함)여야 합니다.');
    ev.target.value = '';
    return;
  }

  if (requestAPI.reqeustOnProgress) {
    alert('검색 결과 처리중 2초 후 다시시도');
    return;
  }

  if (section.items.length > 0) {
    section.items = [];
  }
  
  app.loadingOn = 'visibility';
  requestAPI.reqeustOnProgress = true;

  requestAPI.getBooks(app.searchValue).then(function (items) {
    if (!section.items.length) {
      section.items = items;
    } else {
      section.items = section.items.concat(items);
    }
  });
}

app.displayList = function() {
  section.displayType = 'list';
}

app.displayCard = function() {
  section.displayType = 'card';
}

app.scrollUp = function () {
  window.scroll({
    top: 0,
    behavior: 'smooth'
  });
}

const wrapper = new Gorilla.Component(wrapperTemplate, {}, {
  app,
  section,
});

document.addEventListener('scroll', infiniteScroll);

function infiniteScroll () {
  const scrollPosition = Math.round(window.scrollY);
  const bodyHeight = document.body.offsetHeight;
  const windowHeight = window.innerHeight;
  const reachBottom = bodyHeight - scrollPosition - windowHeight;

  if (reachBottom >= 0 && reachBottom < 30) {
    if (!requestAPI.reqeustOnProgress) {
      app.loadingOn = 'visibility';
      requestAPI.reqeustOnProgress = true;
      requestAPI.displayNumber+= 10;

      requestAPI.getBooks(app.searchValue).then(function (items) {
        section.items = section.items.concat(items);
      });
    }
  }
}

Gorilla.renderToDOM(wrapper, document.querySelector('body'));

/* DO NOT REMOVE */
module.hot.accept();
/* DO NOT REMOVE */

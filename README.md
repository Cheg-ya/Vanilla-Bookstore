# Vanilla Bookstore
**Vanila Bookstore**는 Naver Book API를 이용해 사용자에게 책 정보를 제공하는 웹 어플리케이션입니다.

<p align="center">
  <img src="vanilla-bookstore.gif" />
</p>

## Setup

Install dependencies

```sh
 npm install
```

## Development

```sh
 npm run dev
 visit http://localhost:8080
```

## Features
- 검색창에 1글자 이상 20글자 이하(공백 포함) 검색어를 입력할 수 있습니다.
- 검색어를 입력하면 Naver Book Search API 로부터 Book List를 가져옵니다.
- 검색 데이터를 가져오는 동안에는 로딩 화면을 띄웁니다.
- 검색 결과는 기본적으로 리스트 형식으로 보여집니다.
- 사용자가 리스트/카드 형식으로 볼 수 있도록 선택할 수 있습니다.
- 스크롤바가 화면 최 하단에 도달 시 그 다음 20개를 불러와 목록에 추가됩니다. (무한 스크롤)
- 각 Book List는 아래의 항목들을 표시합니다.
  - 책 제목
  - 작가 이름
  - 출판사 이름
  - 책 요약 정보 (50글자)
  - 출판일
  - 썸네일 이미지 (이미지가 없을 경우, Dummy Image)
  - 해당 검색 결과의 링크 단축 URL ([Naver URL Shortener API](https://developers.naver.com/docs/utils/shortenurl/) 이용)

## Tech
- Plain Javascript
- CSS
- HTML
- Webpack

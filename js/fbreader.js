function FBReader(xml) {

  this.xml = xml;
  this.toc = null;
  this.currentSection = 0;
  var _this = this;

  this.getBookTitle = function() {
    return this.xml.documentElement
			.getElementsByTagName('book-title')[0]
			.textContent;
  };

  this.getBookAuthors = function() {
    return this.getAuthorsFromElementId('title-info');
  };

  this.getDocumentAuthors = function() {
    return this.getAuthorsFromElementId('document-info');
  };

  this.getAuthorsFromElementId = function(id) {
    var authorData = [];
    try {
      var authors = this.xml.documentElement
      .getElementsByTagName(id)[0]
      .getElementsByTagName('author');
      for (var i = 0; i < authors.length; i++) {
        authorData.push(
          this.getAuthorData(
            authors[i]));
      }
    } catch (e) {
      console.log(e);
    }

    return authorData;
  };

  this.getBookAnnotation = function() {
    try {
      var annotation = this.xml.documentElement
				.getElementsByTagName('title-info')[0]
				.getElementsByTagName('annotation')[0];
      return this.renderSection(annotation);
    } catch (e) {
      console.log(e);
      return document.createElement('div');
    }
  };

  this.getProgramUsed = function() {
    try {
      var program = this.xml.documentElement
      .getElementsByTagName('document-info')[0]
      .getElementsByTagName('program-used')[0];
      return program.textContent;
    } catch (e) {
      console.log(e);
      return '';
    }
  };

  this.getDocumentDate = function() {
    try {
      var date = this.xml.documentElement
      .getElementsByTagName('document-info')[0]
      .getElementsByTagName('date')[0];
      return date.textContent;
    } catch (e) {
      console.log(e);
      return '';
    }
  };

  this.getTableOfContents = function() {
    if (this.toc != null) return this.toc;

    this.toc = [];
    var body = this.xml.documentElement
    .getElementsByTagName('body')[0];
    var nodes = body.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].tagName) continue;
      if (nodes[i].tagName != 'section') continue;

      this.toc.push(nodes[i]);
    }

    return this.toc;
  };

  this.getNotes = function() {
    var bodies = this.xml.documentElement
    .getElementsByTagName('body');
    var noteBlocks = [];
    for (var i = 1; i < bodies.length; i++) {
      var name = bodies[i].getAttribute('name');
      if (name.search('notes') >= 0) {
        noteBlocks.push(bodies[i]);
      }
    }

    return noteBlocks;
  };

  this.getSectionTitle = function(section) {
    var tmp = section.getElementsByTagName('title')[0];
    if (!tmp) return null;
    return tmp.textContent;
  };

  this.getAuthorData = function(author) {
    var firstName = author.getElementsByTagName('first-name')[0];
    var middleName = author.getElementsByTagName('middle-name')[0];
    var lastName = author.getElementsByTagName('last-name')[0];
    var nickname = author.getElementsByTagName('nickname')[0];
    firstName = firstName ? firstName.textContent : '';
    middleName = middleName ? middleName.textContent : '';
    lastName = lastName ? lastName.textContent : '';
    nickname = nickname ? nickname.textContent : '';
    return {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      nickname: nickname,
    };
  };

  this.renderSection = function(section) {
    var s;
    if (section.tagName == 'section')
      s = document.createElement('section');
    else if (section.tagName == 'cite')
      s = document.createElement('blockquote');
    else if (section.tagName == 'td')
      s = document.createElement('td');
    else
      s = document.createElement('div');

    if (section.tagName == 'annotation')
      s.className = 'annotation';
    else if (section.tagName == 'epigraph')
      s.className = 'epigraph';

    var nodes = section.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].tagName) continue;
      if (nodes[i].tagName == 'p') {
        s.appendChild(this.renderPara(nodes[i]));
      } else if (nodes[i].tagName == 'empty-line') {
        s.appendChild(document.createElement('hr'));
      } else if (nodes[i].tagName == 'subtitle') {
        var h3 = document.createElement('h3');
        h3.innerHTML = nodes[i].textContent;
        s.appendChild(h3);
        if (nodes[i].hasAttribute('id'))
          h3.id = nodes[i].getAttribute('id');
      } else if (nodes[i].tagName == 'section') {
        s.appendChild(this.renderSection(nodes[i]));
      } else if (nodes[i].tagName == 'cite') {
        s.appendChild(this.renderSection(nodes[i]));
      } else if (nodes[i].tagName == 'poem') {
        s.appendChild(this.renderPoem(nodes[i]));
      } else if (nodes[i].tagName == 'title') {
        var title = document.createElement('h2');
        s.appendChild(title);
        title.innerHTML = nodes[i].textContent;
      } else if (nodes[i].tagName == 'annotation') {
        s.appendChild(this.renderSection(nodes[i]));
      } else if (nodes[i].tagName == 'epigraph') {
        s.appendChild(this.renderSection(nodes[i]));
      } else if (nodes[i].tagName == 'table') {
        s.appendChild(this.renderTable(nodes[i]));
      } else {
        s.appendChild(
          document.createTextNode(
            nodes[i].textContent));
      }
    }

    return s;
  };

  this.renderPara = function(para) {
    var p = document.createElement('p');

    var nodes = para.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType == 3) {
        p.appendChild(nodes[i].cloneNode());
      } else if (nodes[i].nodeType != 1) {
        continue;
      } else if (nodes[i].tagName == 'emphasis') {
        var em = document.createElement('em');
        em.innerHTML = nodes[i].textContent;
        p.appendChild(em);
      } else if (nodes[i].tagName == 'strong') {
        var strong = document.createElement('strong');
        strong.innerHTML = nodes[i].textContent;
        p.appendChild(strong);
      } else if (nodes[i].tagName == 'a') {
        var a = document.createElement('a');
        a.innerHTML = nodes[i].textContent;
        a.href = nodes[i].getAttribute('xlink:href');
        a.className = 'note';
        p.appendChild(a);
      } else {
        p.appendChild(
          document.createTextNode(
            nodes[i].textContent));
      }
    }

    return p;
  };

  this.renderPoem = function(section) {
    var poem = document.createElement('div');
    poem.className = 'poem';

    var stanzas = section.childNodes;
    for (var i = 0; i < stanzas.length; i++) {
      if (!stanzas[i].tagName) continue;
      if (stanzas[i].tagName != 'stanza') continue;

      var stanza = document.createElement('p');

      var verses = stanzas[i].childNodes;
      for (var j = 0; j < verses.length; j++) {
        if (!verses[j].tagName) continue;
        if (verses[j].tagName != 'v') continue;

        stanza.appendChild(
          document.createTextNode(
            verses[j].textContent));
        stanza.appendChild(document.createElement('br'));
      }

      poem.appendChild(stanza);
    }

    return poem;
  };

  this.renderTable = function(section) {
    var table = document.createElement('table');

    var rows = section.childNodes;
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].tagName) continue;
      if (rows[i].tagName != 'tr') continue;

      var row = document.createElement('tr');

      var cells = rows[i].childNodes;
      for (var j = 0; j < cells.length; j++) {
        if (!cells[j].tagName) continue;
        if (cells[j].tagName != 'td') continue;

        row.appendChild(this.renderSection(cells[j]));
      }

      table.appendChild(row);
    }

    return table;
  };

  this.loadSection = function(section) {
    var content = document.getElementById('content');
    content.innerHTML = '';
    content.appendChild(this.renderSection(section));

    var noteLinks = content.getElementsByTagName('a');
    for (var i = 0; i < noteLinks.length; i++) {
      if (noteLinks[i].className == 'note') {
        noteLinks[i].onclick = function() {
          document.getElementById('notes-page')
            .style.display = 'block';
          console.log('showing notes...');
        };
      }
    }
  };

  this.setupMeta = function() {
    document.getElementById('book-title').innerHTML = this.getBookTitle();
    document.getElementById('book-authors').innerHTML = this.renderAuthors(this.getBookAuthors());
    document.getElementById('book-annotation').innerHTML = '';
    document.getElementById('book-annotation')
      .appendChild(this.getBookAnnotation());

    var docAuthors = this.getDocumentAuthors();
    if (docAuthors.length > 0)
      document.getElementById('prepared-by').innerHTML =
        'Prepared by<br>\n'
        + this.renderAuthors(this.getDocumentAuthors());
    var program = this.getProgramUsed();
    if (program)
      document.getElementById('prepared-with').innerHTML =
        'Prepared with<br>\n' + program;
    var date = this.getDocumentDate();
    if (date)
      document.getElementById('prepared-on').innerHTML =
        'Prepared on<br>\n' + date;
  };

  this.renderAuthors = function(authors) {
    var authorsField = '';
    for (var i = 0; i < authors.length; i++) {
      if (authors[i].nickname.length > 0) {
        authorsField += authors[i].nickname + '<br>\n';
      } else {
        authorsField +=
          authors[i].firstName
          + ' ' + authors[i].middleName
          + ' ' + authors[i].lastName + '<br>\n';
      }
    }

    return authorsField;
  };

  this.setupToc = function(toc) {
    document.getElementById('toc').innerHTML = '';
    for (var i = 0; i < toc.length; i++) {
      var li = document.createElement('li');
      document.getElementById('toc').appendChild(li);

      var a = document.createElement('a');
      a.href = '#content';
      a.onclick = this.tocHandler(toc, i);
      li.appendChild(a);

      var title = this.getSectionTitle(toc[i]);
      if (!title) title = '(unnamed)';
      a.innerHTML = title;
    }
  };

  this.setupNotes = function(notes) {
    var notesContent = document.getElementById('notes-content');
    for (var i = 0; i < notes.length; i++) {
      notesContent.appendChild(this.renderSection(notes[i]));
    }
  };

  this.setupNavLinks = function(toc, currentSection) {
    var prevLink = document.getElementById('prev-link');
    var nextLink = document.getElementById('next-link');
    if (currentSection <= 0) {
      prevLink.style.display = 'none';
    } else {
      prevLink.style.display = 'inline';
    }

    if (currentSection >= (toc.length - 1)) {
      nextLink.style.display = 'none';
    } else {
      nextLink.style.display = 'inline';
    }
  };

  this.tocHandler = function(toc, sectionNum) {
    return function() {
      _this.loadSection(toc[sectionNum]);
      _this.setupNavLinks(toc, sectionNum);
      _this.currentSection = sectionNum;
    };
  };
}

window.addEventListener('load', function() {
  var toc = [];
  var book = null;

  var input = document.getElementById('local-file');
  input.addEventListener('change', function() {
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function() {
      var parser = new DOMParser();
      var booksrc = parser.parseFromString(
        reader.result, 'application/xml');
      book = new FBReader(booksrc);
      toc = book.getTableOfContents();

      book.setupMeta(book);
      book.setupToc(toc, book);
      book.setupNotes(book.getNotes());

      book.loadSection(toc[0]);
      book.setupNavLinks(toc, book.currentSection);

      document.getElementById('blurb')
        .style.display = 'none';
      document.getElementById('reader')
        .style.display = 'block';
    };

    reader.readAsText(file);
  }, false);

  var prevLink = document.getElementById('prev-link');
  prevLink.addEventListener('click', function() {
    if (book.currentSection <= 0) {
      alert('You\'re at the beginning of the document.');
    } else {
      book.currentSection--;
      book.loadSection(toc[book.currentSection]);
      book.setupNavLinks(toc, book.currentSection);
    }
  }, false);

  var nextLink = document.getElementById('next-link');
  nextLink.addEventListener('click', function() {
    if (book.currentSection >= (toc.length - 1)) {
      alert('You\'re at the end of the document.');
    } else {
      book.currentSection++;
      book.loadSection(toc[book.currentSection]);
      book.setupNavLinks(toc, book.currentSection);
    }
  }, false);

  var closeNotesLink = document.getElementById('close-notes');
  closeNotesLink.addEventListener('click', function(event) {
    document.getElementById('notes-page').style.display = 'none';
    event.preventDefault();
  }, false);
}, false);

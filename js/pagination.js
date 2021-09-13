/*
Do not delete the following comment. It is essential for tracking purposes.
#Merc2021DoNotDelete
*/

var Pagination = {

    code: '',

    // --------------------
    // Utility
    // --------------------

    // converting initialize data
    Extend: function (data) {
        data = data || {};
        Pagination.totalResults = data.totalResults;
        Pagination.perPage = data.perPage || 12;
        Pagination.size = data.size || Math.round(data.totalResults / Pagination.perPage) + 1;
        Pagination.page = data.page || 1;
        Pagination.step = data.step || 3;
        
    },

    // add pages by number (from [s] to [f])
    Add: function (s, f) {
        for (var i = s; i < f; i++) {
            Pagination.code += '<button role="link" data-text="' + i + '" class="by-keyboard"><span class="show-for-sr">page </span>' + i + '</button>';
        }
    },

    // add last page with separator
    Last: function () {
        Pagination.code += '<i></i><button role="link" data-text="' + Pagination.size + '"  class="by-keyboard"><span class="show-for-sr">page </span>' + Pagination.size + '</button>';
    },

    // add first page with separator
    First: function () {
        Pagination.code += '<button role="link" data-text="1" class="by-keyboard"><span class="show-for-sr">page </span>1</button><i></i>';
    },



    // --------------------
    // Handlers
    // --------------------

    // change page
    Click: function () {
        Pagination.page = +this.dataset.text
        Pagination.Start();
    },

    // previous page
    Prev: function () {
        Pagination.page--;
        if (Pagination.page < 1) {
            Pagination.page = 1;
        }
        Pagination.Start();
    },

    // next page
    Next: function () {
        Pagination.page++;
        if (Pagination.page > Pagination.size) {
            Pagination.page = Pagination.size;
        }
        Pagination.Start();
    },



    // --------------------
    // Script
    // --------------------

    // binding pages
    Bind: function () {
        var a = Pagination.e.getElementsByTagName('button');
        for (var i = 0; i < a.length; i++) {
            if (+a[i].dataset.text === Pagination.page) {
                a[i].className = 'current';
                a[i].setAttribute('aria-current', 'page');
                a[i].focus();
            }
            else {
                a[i].removeAttribute('aria-current');
            }

            a[i].addEventListener('click', Pagination.Click, false);
            
        }
    },

    // write pagination
    Finish: function () {
        Pagination.e.innerHTML = Pagination.code;
        Pagination.code = '';
        Pagination.Bind();
        buttonsEventListener();
    },

    // find pagination type
    Start: function () {
        if (Pagination.size < Pagination.step * 2 + 6) {
            Pagination.Add(1, Pagination.size + 1);
        }
        else if (Pagination.page < Pagination.step * 2 + 1) {
            Pagination.Add(1, Pagination.step * 2 + 4);
            Pagination.Last();
        }
        else if (Pagination.page > Pagination.size - Pagination.step * 2) {
            Pagination.First();
            Pagination.Add(Pagination.size - Pagination.step * 2 - 2, Pagination.size + 1);
        }
        else {
            Pagination.First();
            Pagination.Add(Pagination.page - Pagination.step, Pagination.page + Pagination.step + 1);
            Pagination.Last();
        }



        /* Live region text */
        const fromRecord = Pagination.page == 1 ? Pagination.page : parseInt(Pagination.perPage * Pagination.page) - Pagination.perPage + 1;
        const toRecord = Pagination.page == Pagination.size ? Pagination.totalResults : parseInt(Pagination.page * Pagination.perPage);
        document.getElementById('pageinationText').innerHTML = `${fromRecord} to ${toRecord} of ${Pagination.totalResults} results`;

        document.getElementById('prevButton').style.display = Pagination.page == 1 ? 'none' : 'inline';
        document.getElementById('nextButton').style.display = Pagination.page == Pagination.size ? 'none' : 'inline';
        document.getElementById('mobilePageShow').value = Pagination.page;

        
        if (document.getElementById('mobilePageShow')) {
            document.getElementById('mobilePageShow').addEventListener('change', () => {

                if (document.getElementById('mobilePageShow').value < 1) {
                    Pagination.page = 1;
                } else if (document.getElementById('mobilePageShow').value > Pagination.size) {
                    Pagination.page = Pagination.size;
                } else {
                    Pagination.page = document.getElementById('mobilePageShow').value;
                }

                Pagination.Start();

            });
        }

        Pagination.Finish();
    },



    // --------------------
    // Initialization
    // --------------------

    // binding buttons
    Buttons: function (e) {
        e.querySelector('.prev-button').addEventListener('click', Pagination.Prev, false);
        e.querySelector('.next-button').addEventListener('click', Pagination.Next, false);
    },

    // create skeleton
    Create: function (e) {

        var html = [
            ``,
            '<button role="link" id="prevButton" class="prev-button by-keyboard"><em class="show-for-sr">previous page </em><img alt="" src="img/icons/chevron-left.svg"/></button>', // previous button
            '<span class="desktop"></span>',  // pagination container
            `<input aria-describedby="mobile-aria-pages" type="number" pattern="[0-9]*" inputmode="numeric" class="paginationTextField" id="mobilePageShow" value="${Pagination.page}">`,
            `<span id="mobile-aria-pages" class="mobileText">of ${Pagination.size} pages</span>`, // Mobile pagination
            '<button role="link" id="nextButton" class="next-button by-keyboard"><em class="show-for-sr">next page </em><img alt="" src="img/icons/chevron-right.svg"></button>',  // next button
            ``
        ];

        e.innerHTML = html.join('');
        Pagination.e = e.getElementsByTagName('span')[0];
        Pagination.Buttons(e);
    },

    // init
    Init: function (e, data) {
        Pagination.Extend(data);
        Pagination.Create(e);
        Pagination.Start();
    }
};

/* * * * * * * * * * * * * * * * *
* Initialization
* * * * * * * * * * * * * * * * */

var initPaging = function () {
    if (document.getElementById('custom-dropdown')) {
        document.getElementById('custom-dropdown').addEventListener('change', () => {
            let selectedValue = document.getElementById('custom-dropdown').value;
            Pagination.Init(document.getElementById('pagination'), {
                totalResults: 300,
                page: 1,  // selected page
                step: 1,  // pages before and after current
                perPage: selectedValue, // results per page
            });
        });
    }
    else {
        Pagination.Init(document.getElementById('pagination'), {
            totalResults: 300,
            page: 1,  // selected page
            step: 1,  // pages before and after current
            perPage: 12, // results per page
        });
    }
};

document.addEventListener('DOMContentLoaded', initPaging, false);

function buttonsEventListener() {
    document.querySelectorAll('button').forEach(function (el) {
        // Add event listeners to the various buttons
        el.addEventListener('click', ButtonEventHandler);
        el.addEventListener('keyup', ButtonEventHandler);
        el.addEventListener('blur', ButtonEventHandler);
    });
}

function ButtonEventHandler(event) {
    var type = event.type;
    if (type === 'keyup') {
        if (event.keyCode === 13 || event.keyCode === 32) {
            event.target.classList.remove('by-keyboard');
        }
        else if (event.keyCode === 9) {
            event.target.classList.remove('by-keyboard');
        }
    } else if (type === 'click') {
        event.target.classList.add('by-keyboard');
    }
    else if (type === 'blur') {
        event.target.classList.add('by-keyboard');
    }
}


const MARKDOWN_EDITORS = [];

function vsckb_apply_highlight(selector) {
    selector.find('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}

function vsckb_apply_mermaid(element) {
    element.find('pre code.language-mermaid').each(function(i, block) {
        const CODE_BLOCK = jQuery(block);
        const PRE_BLOCK = CODE_BLOCK.parent();

        const MERMAID_DIV = jQuery( '<div class="mermaid vsckb-mermaid" />' );
        MERMAID_DIV.text( CODE_BLOCK.text() );

        PRE_BLOCK.replaceWith( MERMAID_DIV );
    });

    mermaid.init(undefined,
                 element.find('.vsckb-mermaid'));
}

function vsckb_as_local(time) {
    if (time) {
        if (time.isValid()) {
            if (!time.isLocal()) {
                time = time.local();
            }
        }
    }

    return time;
}

function vsckb_as_utc(time) {
    if (time) {
        if (time.isValid()) {
            if (!time.isUTC()) {
                time = time.utc();
            }
        }
    }

    return time;
}

function vsckb_clone(val) {
    if (val) {
        val = JSON.parse(
            JSON.stringify(val)
        );
    }

    return val;
}

function vsckb_does_match(expr, opts) {
    if (arguments.length < 2) {
        opts = {};
    }

    let funcs = {
        all: function(val) {
            val = vsckb_normalize_str( val );
            for (let i = 1; i < arguments.length; i++) {
                if (val.indexOf( vsckb_normalize_str( arguments[i] ) ) < 0) {
                    return false;
                }
            }

            return true;
        },
        any: function(val) {
            val = vsckb_normalize_str( val );
            for (let i = 1; i < arguments.length; i++) {
                if (val.indexOf( vsckb_normalize_str( arguments[i] ) ) > -1) {
                    return true;
                }
            }

            return false;
        },
        concat: function() {
            let result = '';
            for (let i = 0; i < arguments.length; i++) {
                result += vsckb_to_string(arguments[i]);
            }

            return result;
        },
        contains: (val, search) => {
            val = vsckb_to_string(val).toLowerCase();
            search = vsckb_to_string(search).toLowerCase();

            return val.indexOf(search) > -1;
        },
        debug: function(val, result) {
            if (arguments.length < 2) {
                result = true;
            }

            vsckb_log(val);
            return result;
        },
        float: (val) => {
            return parseFloat(
                vsckb_normalize_str(val).trim()
            );
        },
        int: (val) => {
            return parseInt(
                vsckb_normalize_str(val).trim()
            );
        },
        integer: (val) => {
            return parseInt(
                vsckb_normalize_str(val).trim()
            );
        },
        is_empty: (val) => {
            return '' === vsckb_to_string(val).trim();
        },
        is_nan: (val, asInt) => {
            val = vsckb_to_string(val).trim();
            asInt = !!asInt;

            return isNaN(
                asInt ? parseInt(val) : parseFloat(val)
            );
        },
        is_nil: (val) => {
            return vsckb_is_nil(val);
        },
        norm: (val) => {
            return vsckb_normalize_str(val);
        },
        normalize: (val) => {
            return vsckb_normalize_str(val);
        },
        number: (val) => {
            return parseFloat(
                vsckb_normalize_str(val).trim()
            );
        },
        regex: function(val, pattern, flags) {
            if (arguments.length > 2) {
                flags = vsckb_to_string(flags);
            }

            val = vsckb_to_string(val);
            pattern = vsckb_to_string(pattern);

            return RegExp(pattern, flags).test( val );
        },
        str: (val) => {
            return vsckb_to_string(val);
        },
        str_invoke: function(val, funcs) {
            val = vsckb_to_string(val);

            const ARGS = [];
            for (i = 2; i < arguments.length; i++) {
                ARGS.push( arguments[i] );
            }

            const FUNCS = vsckb_to_string(funcs).split(',').map(f => {
                return f.trim();
            }).filter(f => '' !== f);

            for (const F of FUNCS) {
                val = val[F].apply(val, ARGS);
            }

            return val;
        },
        unix: function(val, isUTC) {
            if (arguments.length < 2) {
                isUTC = true;
            }
            isUTC = !!isUTC;

            val = vsckb_to_string(val);

            const TIME = isUTC ? moment.utc(val) : moment(val);
            if (TIME.isValid()) {
                return TIME.unix();
            }

            return false;
        }
    };
    if (!vsckb_is_nil(opts.funcs)) {
        for (const P in opts.funcs) {
            funcs[ P ] = opts.funcs[ P ];
        }
    }

    let values = {};
    if (!vsckb_is_nil(opts.values)) {
        for (const P in opts.values) {
            values[ P ] = opts.values[ P ];
        }
    }

    try {
        expr = vsckb_to_string(expr);
        if ('' !== expr.trim()) {
            const FILTER = compileExpression(expr, funcs);

            return FILTER(values);
        }
    } catch (e) {
        vsckb_log('vsckb_does_match().error: ' + vsckb_to_string(e));
    }

    return true;
}

function vsckb_external_url(url, text) {
    vsckb_post('openExternalUrl', {
        text: vsckb_to_string(text),
        url: vsckb_to_string(url)
    });
}

function vsckb_from_markdown(md) {
    const CONVERTER = new showdown.Converter();

    const HTML = CONVERTER.makeHtml( vsckb_to_string(md) );

    const CONTENT = jQuery('<div class="vsckb-markdown" />');
    CONTENT.html( HTML );

    CONTENT.find('script')
           .remove();

    CONTENT.find('table')
           .addClass('table')
           .addClass('table-striped')
           .addClass('table-hover');

    // make images responsive
    CONTENT.find('img')
           .addClass('img-fluid');

    // task lists
    CONTENT.find('ul li.task-list-item input[type="checkbox"]').each(function() {
        const CHECKBOX = jQuery(this);
        const LI = CHECKBOX.parent();

        const UL = LI.parent();
        UL.attr('class', 'vsckb-task-list');

        const IS_CHECKED = CHECKBOX.prop('checked');

        CHECKBOX.remove();

        const LABEL = vsckb_to_string(LI.text()).trim();

        LI.html('');
        LI.attr('style', null);

        const NEW_CHECKBOX = jQuery('<div class="form-check">' + 
                                    '<input class="form-check-input" type="checkbox" value="1">' + 
                                    '<label class="form-check-label" />' + 
                                    '</div>');
        NEW_CHECKBOX.find('input.form-check-input')
                    .prop('checked', IS_CHECKED)
                    .prop('disabled', true);

        NEW_CHECKBOX.find('.form-check-label')
                    .text( LABEL );

        NEW_CHECKBOX.appendTo( LI );
    });

    CONTENT.find('a').each(function() {
        const A = jQuery(this);

        let text = vsckb_to_string( A.text() );
        let href = vsckb_to_string( A.attr('href') );

        if ('' === text.trim()) {
            text = href;
        }

        A.attr('href', '#');
        A.on('click', function() {
            vsckb_external_url(href, text);
        });
    });

    return CONTENT;
}

function vsckb_get_sort_val(x, y) {
    if (x !== y) {
        if (x > y) {
            return 1;
        } else {
            return -1;
        }
    }

    return 0;
}

function vsckb_invoke_for_md_editor(id, action) {
    id = vsckb_to_string(id);

    MARKDOWN_EDITORS.forEach(e => {
        if (e.element.attr('id') !== id) {
            return;
        }

        if (action) {
            action(e);
        }
    });
}

function vsckb_is_nil(val) {
    return null === val ||
           'undefined' === typeof val;
}

function vsckb_normalize_str(val) {
    return vsckb_to_string(val).toLowerCase().trim();
}

function vsckb_open_url(urlId) {
    vsckb_post('openKnownUrl',
               vsckb_normalize_str(urlId));
}

function vsckb_post(cmd, data) {
    try {
        vscode.postMessage({
            command: vsckb_to_string(cmd).trim(),
            data: data
        });

        return true;
    } catch (e) {
        return false;
    }
}

function vsckb_raise_event(name, data) {
    vsckb_post('raiseEvent', {
        name: vsckb_normalize_str(name),
        data: data
    });
}

function vsckb_sort_by(arr, sorter) {
    return arr.sort((x, y) => {
        return vsckb_get_sort_val(
            sorter(x), sorter(y)
        );
    });
}

function vsckb_to_pretty_time(time) {
    const NOW = moment.utc();

    if (!time) {
        return time;
    }

    if (!time.isValid()) {
        return false;
    }

    if (!time.isUTC()) {
        time = time.utc();
    }

    const DURATION = moment.duration( NOW.diff(time) );
    const SECONDS = Math.floor(
        DURATION.asSeconds()
    );

    let text = false;

    if (SECONDS < 60) {
        text = '< 1 min';
    } else if (SECONDS < 120) {
        text = '~ 1 min';
    } else if (SECONDS < 3600) {
        text = `~ ${ Math.floor(SECONDS / 60.0) } min`;
    } else if (SECONDS < 7200) {
        text = '~ 1 h';
    } else {
        if (NOW.format('YYYY-MM-DD') === time.format('YYYY-MM-DD')) {
            text = 'today';
        } else {
            const YESTERDAY = moment.utc( NOW.toISOString() )
                                    .subtract(1, 'days');
            if (YESTERDAY.format('YYYY-MM-DD') === time.format('YYYY-MM-DD')) {
                text = 'yesterday';
            } else {
                if (SECONDS < 172800) {
                    text = '~ 1 d';
                }
            }
        }
    }

    if (false === text) {
        text = `~ ${ Math.floor(SECONDS / 86400.0) } d`;
    }

    return text;
}

function vsckb_to_string(val) {
    if ('string' === typeof val) {
        return val;
    }

    if (vsckb_is_nil(val)) {
        return '';
    }

    return '' + val;
}

// s. https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function vsckb_uuid() {
    const S4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    };

    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

jQuery(() => {
    showdown.setFlavor('github');

    showdown.setOption('completeHTMLDocument', false);
    showdown.setOption('encodeEmails', true);
    showdown.setOption('ghCodeBlocks', true);
    showdown.setOption('ghCompatibleHeaderId', true);
    showdown.setOption('headerLevelStart', 3);
    showdown.setOption('openLinksInNewWindow', true);
    showdown.setOption('simpleLineBreaks', true);
    showdown.setOption('simplifiedAutoLink', true);
    showdown.setOption('strikethrough', true);
    showdown.setOption('tables', true);
    showdown.setOption('tasklists', true);
});

jQuery(() => {
    jQuery('.vsckb-btn-with-known-url, .vsckb-with-known-url').on('click', function() {
        const BTN = jQuery(this);

        const URL_ID = vsckb_normalize_str( BTN.attr('vsckb-url') );
        if ('' === URL_ID) {
            return;
        }

        vsckb_open_url(URL_ID);
    });
});

jQuery(() => {
    jQuery('.vsckb-markdown-editor').each(function() {
        const EDITOR = jQuery(this);

        const MAX_LENGTH = parseInt(
            vsckb_to_string( EDITOR.attr('maxlength') ).trim()
        );

        const EDITOR_OPTS = {
            dragDrop: true,
            lineNumbers: true,
            lineWrapping: true,
            mode: "text/x-markdown",
            autoRefresh: {
                delay: 500
            }
        };

        const NEW_EDITOR = CodeMirror.fromTextArea(EDITOR[0], EDITOR_OPTS);

        if (!isNaN(MAX_LENGTH) && MAX_LENGTH >= 0) {
            NEW_EDITOR.on('change', function(cm) {
                const CURRENT_VALUE = vsckb_to_string( cm.getValue() );
                if (CURRENT_VALUE.length > MAX_LENGTH) {
                    cm.setValue(
                        CURRENT_VALUE.substr(0, MAX_LENGTH)
                    );

                    cm.setCursor(cm.lineCount(), 0);
                }
            });
        }

        MARKDOWN_EDITORS.push({
            editor: NEW_EDITOR,
            element: EDITOR
        });
    });
});

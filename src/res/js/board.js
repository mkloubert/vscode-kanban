
let allCards;
let currentUser;
let nextKanbanCardId;

function vsckb_get_assigned_to_val(field) {
    let assignedTo = vsckb_to_string( field.val() ).trim();
    if ('' === assignedTo) {
        assignedTo = undefined;
    } else {
        assignedTo = {
            name: assignedTo
        };
    }

    return assignedTo;
}

function vsckb_get_cards_sorted(type) {
    return allCards[type].sort((x, y) => {
        // first compare by prio (DESC)
        const COMP_0 = vsckb_get_card_prio_sort_val( y ) - 
                       vsckb_get_card_prio_sort_val( x );
        if (0 !== COMP_0) {
            return COMP_0;
        }

        // then by type
        const COMP_1 = vsckb_get_card_type_sort_val( x ) - 
                       vsckb_get_card_type_sort_val( y );
        if (0 !== COMP_1) {
            return COMP_1;
        }

        // then by title
        return vsckb_get_sort_val( vsckb_normalize_str(x.title), 
                                   vsckb_normalize_str(y.title) );
    });
}

function vsckb_get_card_prio_sort_val(item) {
    let prio = parseFloat(
        vsckb_to_string(item.prio).trim()
    );

    if (isNaN(prio)) {
        prio = 0;
    }

    return prio;
}

function vsckb_get_card_type_sort_val(item) {
    switch (vsckb_normalize_str(item.type)) {
        case 'emergency':
            return -2;

        case 'bug':
            return -1;
    }

    return 0;
}

function vsckb_get_prio_val(field) {
    let prio = vsckb_to_string(
        field.val()
    ).trim();

    if ('' === prio) {
        return undefined;
    }

    prio = parseFloat(
        prio
    );

    return isNaN(prio) ? false
                       : prio;
}

function vsckb_get_user_list() {
    const USERS = [];
    const ADD_UNIQUE = (name) => {
        name = vsckb_to_string(name).trim();
        if ('' !== name) {
            if (USERS.map(x => vsckb_normalize_str(x)).indexOf( vsckb_normalize_str(name) ) < 0) {
                USERS.push(name);

                return true;
            }
        }

        return false;
    };

    const CUR_USER = currentUser;
    if (CUR_USER) {
        ADD_UNIQUE(
            CUR_USER.name
        );
    }

    const ALL_CARDS = allCards;
    if (ALL_CARDS) {
        for (const TYPE in ALL_CARDS) {
            for (const ITEM of ALL_CARDS[TYPE]) {
                if (ITEM.assignedTo) {
                    ADD_UNIQUE( ITEM.assignedTo.name );
                }
            }
        }    
    }

    return USERS.sort((x, y) => {
        return vsckb_get_sort_val( vsckb_normalize_str(x) ) - 
               vsckb_get_sort_val( vsckb_normalize_str(y) );
    });
}

function vsckb_refresh_card_view() {
    nextKanbanCardId = -1;

    for (const TYPE in allCards) {
        const CARD = jQuery(`#vsckb-card-${ TYPE }`);
        const CARD_BODY = CARD.find('.vsckb-primary-card-body');

        CARD_BODY.html('');

        vsckb_get_cards_sorted(TYPE).forEach((i) => {
            const ID = ++nextKanbanCardId;

            const CARD_TYPE = TYPE;
            const CARD_LIST = allCards[CARD_TYPE];

            const NEW_ITEM = jQuery('<div class="card vsckb-kanban-card border border-dark">' +
                                    '<div class="card-header font-weight-bold">' + 
                                    '<span class="vsckb-title" />' + 
                                    '<div class="vsckb-buttons float-right" />' + 
                                    '</div>' + 
                                    '<div class="card-body text-dark" />' + 
                                    '<div class="card-footer text-dark">' + 
                                    '<div class="vsckb-buttons float-right" />' + 
                                    '</div>' + 
                                    '</div>');
            const NEW_ITEM_HEADER = NEW_ITEM.find('.card-header');
            const NEW_ITEM_BODY = NEW_ITEM.find('.card-body');

            const NEW_ITEM_BUTTONS = NEW_ITEM_HEADER.find('.vsckb-buttons');

            // delete button
            {
                const DELETE_BTN = jQuery('<a class="btn btn-sm" title="Delete Card">' + 
                                          '<i class="fa fa-trash" aria-hidden="true"></i>' + 
                                          '</a>');

                DELETE_BTN.on('click', function() {
                    const WIN = jQuery('#vsckb-delete-card-modal');

                    WIN.find('.modal-footer .vsckb-no-btn').off('click').on('click', function() {
                        WIN.modal('hide');
                    });

                    WIN.find('.modal-footer .vsckb-yes-btn').off('click').on('click', function() {
                        vsckb_remove_item(i);
                        vsckb_save_board();

                        vsckb_refresh_card_view();
                        
                        WIN.modal('hide');
                    });

                    const CONFIRM_MSG = jQuery(`<span>Are you sure to delete <strong class="vsckb-title" /> card of <strong class="vsckb-type" />?</span>`);

                    CONFIRM_MSG.find('.vsckb-title').text(
                        i.title
                    );
                    CONFIRM_MSG.find('.vsckb-type').text(
                        jQuery(`#vsckb-card-${ CARD_TYPE } .vsckb-primary-card-header span.vsckb-title`).text()
                    );

                    WIN.find('.modal-body')
                       .html('')
                       .append( CONFIRM_MSG );

                    WIN.modal('show');
                });

                DELETE_BTN.appendTo( NEW_ITEM_BUTTONS );
            }

            // edit button
            {
                const EDIT_BTN = jQuery('<a class="btn btn-sm" title="Edit Card">' + 
                                        '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>' + 
                                        '</a>');

                EDIT_BTN.on('click', function() {
                    const WIN = jQuery('#vsckb-edit-card-modal');
                    const WIN_BODY = WIN.find('.modal-body');
                    const WIN_FOOTER = WIN.find('.modal-footer');
                    const WIN_HEADER = WIN.find('.modal-header');
                    const WIN_CLOSE_BTN = WIN_HEADER.find('button.close');
                    const WIN_TITLE = WIN_HEADER.find('.modal-title');

                    let user;
                    if (i.assignedTo) {
                        user = i.assignedTo.name;
                    }            

                    const TITLE_FIELD = WIN_BODY.find('#vsckb-edit-card-title');
                    TITLE_FIELD.val( vsckb_to_string(i.title) );

                    const DESCRIPTION_FIELD = WIN.find('#vsckb-edit-card-description');
                    DESCRIPTION_FIELD.val( vsckb_to_string(i.description) );

                    const TYPE_FIELD = WIN.find('#vsckb-edit-card-type');
                    TYPE_FIELD.val( vsckb_normalize_str(i.type) );

                    const PRIO_FIELD = WIN.find('#vsckb-edit-card-prio');
                    PRIO_FIELD.val( vsckb_to_string(i.prio).trim() );

                    const ASSIGNED_TO_FIELD = WIN.find('#vsckb-edit-card-assigned-to');
                    ASSIGNED_TO_FIELD.val( vsckb_to_string(user) );

                    WIN.attr('vsckb-type', CARD_TYPE);

                    vsckb_win_header_from_card_type(WIN_HEADER, CARD_TYPE);

                    WIN.find('.modal-footer .vsckb-save-btn').off('click').on('click', function() {
                        const TITLE = vsckb_to_string(
                            TITLE_FIELD.val()
                        ).trim();
                        if ('' === TITLE) {
                            TITLE_FIELD.focus();
                            return;
                        }

                        const PRIO = vsckb_get_prio_val(PRIO_FIELD);
                        if (false === PRIO) {
                            PRIO_FIELD.focus();
                            return;
                        }
                        
                        let description = vsckb_to_string(
                            DESCRIPTION_FIELD.val()
                        ).trim();
                        if ('' === description) {
                            description = undefined;
                        }

                        let type = vsckb_normalize_str( TYPE_FIELD.val() );
                        if ('' === type) {
                            type = undefined;
                        }

                        i.assignedTo = vsckb_get_assigned_to_val(ASSIGNED_TO_FIELD);
                        i.title = TITLE;
                        i.description = description;
                        i.prio = PRIO;
                        i.type = type;
            
                        vsckb_save_board();
                        vsckb_refresh_card_view();
            
                        WIN.modal('hide');
                    });

                    WIN.modal('show');
                });

                EDIT_BTN.appendTo( NEW_ITEM_BUTTONS );
            }

            NEW_ITEM_HEADER.find('.vsckb-title')
                           .text( vsckb_to_string(i.title).trim() );

            const DESC = vsckb_to_string(i.description).trim();
            if ('' === DESC) {
                NEW_ITEM_BODY.hide();
            } else {
                const HTML = vsckb_to_string(
                    jQuery('<span />').text(DESC)
                                      .html()
                ).trim();

                NEW_ITEM_BODY.html( HTML.split('\n').join('<br />') );
            }

            let newItemHeaderBgColor = 'bg-info';
            let newItemHeaderTextColor = 'text-dark';
            switch (vsckb_normalize_str(i.type)) {
                case 'bug':
                    newItemHeaderBgColor = 'bg-dark';
                    newItemHeaderTextColor = 'text-white';
                    break;

                case 'emergency':
                    newItemHeaderBgColor = 'bg-danger';
                    newItemHeaderTextColor = 'text-white';
                    break;
            }

            NEW_ITEM.find('.card-header')
                    .addClass(newItemHeaderBgColor)
                    .addClass(newItemHeaderTextColor);

            const UPDATE_BORDER = (borderClass, borderWidth) => {
                NEW_ITEM.removeClass('border-dark')
                        .removeClass('border-primary')
                        .addClass(borderClass);
            };

            NEW_ITEM.on('mouseleave', function() {
                UPDATE_BORDER('border-dark');
            }).on('mouseenter', function() {
                UPDATE_BORDER('border-primary');
            });

            NEW_ITEM.appendTo(CARD_BODY);

            vsckb_update_card_item_footer(NEW_ITEM, i);
        });
    }
}

function vsckb_remove_item(item) {
    for (const CARD_TYPE in allCards) {
        allCards[CARD_TYPE] = allCards[CARD_TYPE].filter(x => x !== item);
    }
}

function vsckb_save_board() {
    vsckb_post('saveBoard',
               allCards);
}

function vsckb_setup_assigned_to(field, user) {
    user = vsckb_normalize_str(user);

    let newVal = '';

    if ('' !== user) {
        for (const U of vsckb_get_user_list()) {
            if (vsckb_normalize_str(U) === user) {
                newVal = U;
            }
        }
    }

    if (false !== newVal) {
        field.val( newVal );
    }
}

function vsckb_update_card_item_footer(item, entry) {
    const CARD = item.parents('.vsckb-card');
    const CARD_ID = CARD.attr('id');
    const CARD_TYPE = CARD_ID.substr(11);
    const CARD_BODY = CARD.find('.vsckb-primary-card-body');

    const CARD_LIST = allCards[CARD_TYPE];

    const ITEM_FOOTER = item.find('.card-footer');
    const ITEM_FOOTER_BUTTONS = ITEM_FOOTER.find('.vsckb-buttons');

    ITEM_FOOTER.hide();
    ITEM_FOOTER_BUTTONS.html('');

    const MOVE_CARD = (target) => {
        if (CARD_LIST !== allCards[CARD_TYPE]) {
            return;
        }

        vsckb_remove_item(entry);

        allCards[target].push(entry);    

        vsckb_save_board();
        vsckb_refresh_card_view();
    };

    const ADD_DONE_BTN = () => {
        const DONE_BTN = jQuery('<a class="btn btn-sm" title="Move To \'Done\'">' + 
                                '<i class="fa fa-check-circle" aria-hidden="true"></i>' + 
                                '</a>');

        DONE_BTN.on('click', function() {
            MOVE_CARD('done');
        });

        DONE_BTN.appendTo( ITEM_FOOTER_BUTTONS );
    };

    const ADD_IN_PROGRESS_BTN = (icon) => {
        const IN_PROGRESS_BTN = jQuery('<a class="btn btn-sm" title="Move To \'In Progress\'">' + 
                                       '<i class="fa" aria-hidden="true"></i>' + 
                                       '</a>');
        IN_PROGRESS_BTN.find('.fa')
                       .addClass(`fa-${ icon }`);

        IN_PROGRESS_BTN.on('click', function() {
            MOVE_CARD('in-progress');
        });

        IN_PROGRESS_BTN.appendTo( ITEM_FOOTER_BUTTONS );
    };

    const ADD_TEST_BTN = () => {
        const TEST_BTN = jQuery('<a class="btn btn-sm" title="Move To \'Testing\'">' + 
                                '<i class="fa fa-heartbeat" aria-hidden="true"></i>' + 
                                '</a>');
        
        TEST_BTN.on('click', function() {
            MOVE_CARD('testing');
        });

        TEST_BTN.appendTo( ITEM_FOOTER_BUTTONS );
    };

    let isVisible = true;
    switch (CARD_TYPE) {
        case 'todo':
            {
                ADD_IN_PROGRESS_BTN('play-circle');
            }
            break;

        case 'in-progress':
            {
                const STOP_BTN = jQuery('<a class="btn btn-sm" title="Move To \'Todo\'">' + 
                                        '<i class="fa fa-stop-circle" aria-hidden="true"></i>' + 
                                        '</a>');
                STOP_BTN.on('click', function() {
                    MOVE_CARD('todo');
                });
                STOP_BTN.appendTo( ITEM_FOOTER_BUTTONS );

                ADD_TEST_BTN();                
                ADD_DONE_BTN();
            }
            break;

        case 'testing':
            {
                ADD_IN_PROGRESS_BTN('thumbs-down');
                ADD_DONE_BTN();
            }
            break;

        case 'done':
            {
                ADD_TEST_BTN();

                const REDO_BTN = jQuery('<a class="btn btn-sm" title="Move To \'In Progress\'">' + 
                                        '<i class="fa fa-refresh" aria-hidden="true"></i>' + 
                                        '</a>');
                REDO_BTN.on('click', function() {
                    MOVE_CARD('in-progress');
                });
                REDO_BTN.appendTo( ITEM_FOOTER_BUTTONS );
            }
            break;
    }

    if (isVisible) {
        ITEM_FOOTER.show();
    }
}

function vsckb_win_header_from_card_type(header, type) {
    const WIN_CLOSE_BTN = header.find('button.close');

    header.removeClass('bg-primary')
          .removeClass('bg-secondary')
          .removeClass('bg-warning')
          .removeClass('bg-success')
          .removeClass('text-dark')
          .removeClass('text-white');

    WIN_CLOSE_BTN.removeClass('text-dark')
                 .removeClass('text-white');

    let bgHeaderClass = false;
    let textHeaderClass = false;
    let textCloseBtnClass = false;
    switch ( vsckb_normalize_str(type) ) {
        case 'todo':
            bgHeaderClass = 'bg-secondary';
            textHeaderClass = textCloseBtnClass = 'text-dark';
            break;

        case 'in-progress':
            bgHeaderClass = 'bg-primary';
            textHeaderClass = textCloseBtnClass = 'text-white';
            break;

        case 'testing':
            bgHeaderClass = 'bg-warning';
            textHeaderClass = textCloseBtnClass = 'text-white';
            break;

        case 'done':
            bgHeaderClass = 'bg-success';
            textHeaderClass = textCloseBtnClass = 'text-white';
            break;    
    }

    if (false !== bgHeaderClass) {
        header.addClass(bgHeaderClass);
    }
    if (false !== textHeaderClass) {
        header.addClass(textHeaderClass);
    }

    if (false !== textCloseBtnClass) {
        WIN_CLOSE_BTN.addClass(textCloseBtnClass);
    }
}


jQuery(() => {
    allCards = {
        'todo': [],
        'in-progress': [],
        'testing': [],
        'done': [],
    };
});

jQuery(() => {
    const WIN = jQuery('#vsckb-clear-done-modal');

    jQuery('#vsckb-card-done .vsckb-buttons .vsckb-clear-btn').on('click', function() {
        WIN.modal('show');
    });

    WIN.find('.modal-footer .vsckb-no-btn').on('click', function() {
        WIN.modal('hide');
    });
    
    WIN.find('.modal-footer .vsckb-yes-btn').on('click', function() {
        allCards['done'] = [];

        vsckb_save_board();
        vsckb_refresh_card_view();

        WIN.modal('hide');
    });
});

jQuery(() => {
    const WIN = jQuery('#vsckb-add-card-modal');
    
    const TITLE_FIELD = WIN.find('#vsckb-new-card-title');
    const DESCRIPTION_FIELD = WIN.find('#vsckb-new-card-description');

    TITLE_FIELD.off('keyup').on('keyup', function(e) {
        if (13 == e.which) {
            e.preventDefault();
            DESCRIPTION_FIELD.focus();

            return;
        }
    });

    WIN.on('shown.bs.modal', function (e) {
        TITLE_FIELD.focus();
    });
});

jQuery(() => {
    const WIN = jQuery('#vsckb-edit-card-modal');
    
    const DESCRIPTION_FIELD = WIN.find('#vsckb-edit-card-description');

    WIN.on('shown.bs.modal', function (e) {
        DESCRIPTION_FIELD.focus();
    });
});

jQuery(() => {
    jQuery('body main .row .col .vsckb-card .vsckb-buttons .vsckb-add-btn').on('click', function() {
        const BTN = jQuery(this);

        const CARD = BTN.parent().parent().parent();
        const CARD_TITLE = CARD.find('.vsckb-primary-card-header span.vsckb-title');
        const TYPE = CARD.attr('id').substr(11).toLowerCase().trim();

        const WIN = jQuery('#vsckb-add-card-modal');
        const WIN_BODY = WIN.find('.modal-body');
        const WIN_FOOTER = WIN.find('.modal-footer');
        const WIN_HEADER = WIN.find('.modal-header');
        const WIN_CLOSE_BTN = WIN_HEADER.find('button.close');
        const WIN_TITLE = WIN_HEADER.find('.modal-title');

        const TITLE_FIELD = WIN_BODY.find('#vsckb-new-card-title');
        TITLE_FIELD.val('');

        const DESCRIPTION_FIELD = WIN.find('#vsckb-new-card-description');
        DESCRIPTION_FIELD.val('');

        const TYPE_FIELD = WIN.find('#vsckb-new-card-type');

        const ASSIGNED_TO_FIELD = WIN.find('#vsckb-new-card-assigned-to');
        const PRIO_FIELD = WIN.find('#vsckb-new-card-prio');
        
        WIN.attr('vsckb-type', TYPE);

        vsckb_win_header_from_card_type(WIN_HEADER, TYPE);

        const WIN_TITLE_TEXT = jQuery('<span>Add Card To <strong class="vsckb-card-title" /></span>');
        WIN_TITLE_TEXT.find('.vsckb-card-title')
                      .text( "'" + CARD_TITLE.text() + "'" );

        WIN_TITLE.html('')
                 .append( WIN_TITLE_TEXT );

        WIN_FOOTER.find('.btn').off('click').on('click', function() {
            const TITLE = vsckb_to_string(
                TITLE_FIELD.val()
            ).trim();
            if ('' === TITLE) {
                TITLE_FIELD.focus();
                return;
            }

            const PRIO = vsckb_get_prio_val(PRIO_FIELD);
            if (false === PRIO) {
                PRIO_FIELD.focus();
                return;
            }
            
            let description = vsckb_to_string(
                DESCRIPTION_FIELD.val()
            ).trim();
            if ('' === description) {
                description = undefined;
            }

            let type = vsckb_normalize_str( TYPE_FIELD.val() );
            if ('' === type) {
                type = undefined;
            }

            allCards[ TYPE ].push({
                assignedTo: vsckb_get_assigned_to_val(ASSIGNED_TO_FIELD),
                description: description,
                prio: PRIO,
                title: TITLE,
                type: type
            });

            vsckb_save_board();
            vsckb_refresh_card_view();

            WIN.modal('hide');
        });

        WIN.modal('show');
    });
});

jQuery(() => {
    window.addEventListener('message', (e) => {
        if (!e) {
            return;
        }

        const MSG = e.data;
        if (!MSG) {
            return;
        }

        try {
            switch (MSG.command) {
                case 'setBoard':
                    {
                        allCards = MSG.data;

                        vsckb_refresh_card_view();
                    }
                    break;

                case 'setCurrentUser':
                    if (MSG.data) {
                        currentUser = MSG.data;

                        const ASSIGNED_TO_FIELD = jQuery('#vsckb-new-card-assigned-to');
                        if ('' === vsckb_to_string( ASSIGNED_TO_FIELD.val() ).trim()) {
                            vsckb_setup_assigned_to(ASSIGNED_TO_FIELD,
                                                    MSG.data.name);
                        }
                    } else {
                        currentUser = undefined;
                    }
                    break;

                case 'setTitleAndFilePath':
                    {
                        let docTitle = 'Kanban Board';

                        const TITLE = vsckb_to_string(MSG.data.title).trim();
                        if ('' !== TITLE) {
                            docTitle = `${ docTitle } (${ TITLE })`;
                        }

                        jQuery('header nav.navbar .navbar-brand span').text(
                            docTitle
                        ).attr('title', vsckb_to_string(MSG.data.file).trim());
                    }
                    break;
            }
        } catch (e) {
            vsckb_log(`window.addEventListener.message: ${ vsckb_to_string(e) }`);
        }
    });
});

jQuery(() => {
    jQuery('.modal .modal-body .vsckb-card-type-list').each(function() {
        const LIST = jQuery(this);

        const SELECT = LIST.find('select');

        SELECT.append('<option value="bug">Bug</option>')
              .append('<option value="emergency">Emergency</option>')
              .append('<option value="" selected>Note</option>');
    });
});

jQuery(() => {
    jQuery('.vsckb-card .vsckb-primary-card-body').each(function() {
        const CARD_BODY = jQuery(this);
        CARD_BODY.html('');

        const LOADER = jQuery('<img class="vsckb-ajax-loader" />');
        LOADER.attr('src', VSCKB_AJAX_LOADER_16x11);
        LOADER.appendTo( CARD_BODY );
    });
});

jQuery(() => {
    vsckb_post('onLoaded');
});

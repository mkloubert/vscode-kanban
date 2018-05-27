
let allCards;
let nextKanbanCardId;

function vsckb_refresh_card_view() {
    nextKanbanCardId = -1;

    for (const TYPE in allCards) {
        const CARD = jQuery(`#vsckb-card-${ TYPE }`);
        const CARD_BODY = CARD.find('.vsckb-primary-card-body');

        CARD_BODY.html('');

        vsckb_sort_by(allCards[TYPE], i => vsckb_normalize_str(i.title)).forEach((i) => {
            const ID = ++nextKanbanCardId;
            const DROP_DOWN_ID = `vsckb-dropdownMenuButton-${ ID }`;

            const CARD_TYPE = TYPE;
            const CARD_LIST = allCards[CARD_TYPE];

            const NEW_ITEM = jQuery('<div class="card vsckb-kanban-card border border-dark">' +
                                    '<div class="card-header font-weight-bold text-white bg-dark">' + 
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
                                          '<i class="fa fa-eraser" aria-hidden="true"></i>' + 
                                          '</a>');

                DELETE_BTN.on('click', function() {
                    const WIN = jQuery('#vsckb-delete-card-modal');

                    WIN.find('.modal-footer .vsckb-no-btn').off('click').on('click', function() {
                        WIN.modal('hide');
                    });

                    WIN.find('.modal-footer .vsckb-yes-btn').off('click').on('click', function() {
                        if (CARD_LIST === allCards[CARD_TYPE]) {
                            allCards[CARD_TYPE] = CARD_LIST.filter(x => x !== i);

                            NEW_ITEM.remove();
                            
                            vsckb_save_board();
                        }

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

                    const TITLE_FIELD = WIN_BODY.find('#vsckb-edit-card-title');
                    TITLE_FIELD.val( vsckb_to_string(i.title) );

                    const DESCRIPTION_FIELD = WIN.find('#vsckb-edit-card-description');
                    DESCRIPTION_FIELD.val( vsckb_to_string(i.description) );

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
                        
                        let description = vsckb_to_string(
                            DESCRIPTION_FIELD.val()
                        ).trim();
                        if ('' === description) {
                            description = undefined;
                        }
            
                        i.title = TITLE;
                        i.description = description;
            
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
                NEW_ITEM_BODY.append( jQuery('<span class="vsckb-no-description" />').text('No description') );
            } else {
                const HTML = vsckb_to_string(
                    jQuery('<span />').text(DESC)
                                      .html()
                ).trim();

                NEW_ITEM_BODY.html( HTML.split('\n').join('<br />') );
            }

            NEW_ITEM.appendTo(CARD_BODY);

            vsckb_update_card_item_footer(NEW_ITEM, i);
        });
    }
}

function vsckb_save_board() {
    vsckb_post('saveBoard',
               allCards);
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

        allCards[CARD_TYPE] = CARD_LIST.filter(x => x !== entry);

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
            
            let description = vsckb_to_string(
                DESCRIPTION_FIELD.val()
            ).trim();
            if ('' === description) {
                description = undefined;
            }

            allCards[ TYPE ].push({
                title: TITLE,
                description: description
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
            }
        } catch (e) {
            vsckb_log(`window.addEventListener.message: ${ vsckb_to_string(e) }`);
        }
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

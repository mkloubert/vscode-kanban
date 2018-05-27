
let allCards;
let nextKanbanCardId;

function vsckb_refresh_card_view() {
    nextKanbanCardId = -1;

    for (const TYPE in allCards) {
        const CARD = jQuery(`#vsckb-card-${ TYPE }`);
        const CARD_BODY = CARD.find('.card-body');

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
                                    '</div>');
            const NEW_ITEM_HEADER = NEW_ITEM.find('.card-header');
            const NEW_ITEM_BODY = NEW_ITEM.find('.card-body');

            const NEW_ITEM_BUTTONS = NEW_ITEM_HEADER.find('.vsckb-buttons');

            // delete button
            {
                const DELETE_BTN = jQuery('<a class="btn btn-sm btn-danger" title="Delete Card">' + 
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

                    const CONFIRM_MSG = jQuery(`<span>Are you sure to delete <strong class="vsckb-title" /> card inside <strong class="vsckb-type" />?</span>`);

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

            /*
            NEW_ITEM.on('dragend',function(e){ 
                e.preventDefault();

                vsckb_log('DROP.1: ' + Object.keys( e ));
                vsckb_log('DROP.2: ' + $(e.relatedTarget).attr('class'));
            }).on('dragover',function(e){
                e.preventDefault();

                // vsckb_log('DRAG_OVER: ' + JSON.stringify( $(e.target).parent().attr('class') ));
            }).on('dragenter', function (e) {    
                e.preventDefault();
                
                // vsckb_log('DRAG_ENTER: ' + JSON.stringify(e));
            });*/
            
            NEW_ITEM.prop('draggable', true);
        });
    }
}

function vsckb_save_board() {
    vsckb_post('saveBoard',
               allCards);
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
    jQuery('body main .row .col .vsckb-card .vsckb-buttons .vsckb-add-btn').on('click', function() {
        const BTN = jQuery(this);

        const CARD = BTN.parent().parent().parent();
        const CARD_TITLE = CARD.find('.card-header span.vsckb-title');
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

        WIN_HEADER.removeClass('bg-primary')
                  .removeClass('bg-secondary')
                  .removeClass('bg-warning')
                  .removeClass('bg-success')
                  .removeClass('text-dark')
                  .removeClass('text-white');

        WIN_CLOSE_BTN.removeClass('text-dark')
                     .removeClass('text-white');

        WIN.attr('vsckb-type', TYPE);

        let bgHeaderClass = false;
        let textHeaderClass = false;
        let textCloseBtnClass = false;
        switch (TYPE) {
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
            WIN_HEADER.addClass(bgHeaderClass);
        }
        if (false !== textHeaderClass) {
            WIN_HEADER.addClass(textHeaderClass);
        }

        if (false !== textCloseBtnClass) {
            WIN_CLOSE_BTN.addClass(textCloseBtnClass);
        }

        WIN_TITLE.text(
            `Add Card to '${ CARD_TITLE.text() }'`
        );

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
    vsckb_post('onLoaded');
});

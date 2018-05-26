
const ALL_CARDS = {
    'todo': [],
    'in-progress': [],
    'testing': [],
    'done': [],
};

function vsckb_refresh_card_view() {
    for (const TYPE in ALL_CARDS) {
        const CARD = jQuery(`#vsckb-card-${ TYPE }`);
        const CARD_BODY = CARD.find('.card-body');

        CARD_BODY.html('');

        ALL_CARDS[TYPE].forEach((i) => {
            const NEW_ITEM = jQuery('<div class="card vsckb-kanban-card">' +
                                    '<div class="card-header font-weight-bold">' + 
                                    '<span class="vsckb-title" />' + 
                                    '<div class="vsckb-buttons float-right" />' + 
                                    '</div>' + 
                                    '<div class="card-body" />' + 
                                    '</div>');
            const NEW_ITEM_HEADER = NEW_ITEM.find('.card-header');
            const NEW_ITEM_BODY = NEW_ITEM.find('.card-body');

            const NEW_ITEM_HEADER_BUTTONS = NEW_ITEM_HEADER.find('.vsckb-buttons');
            {
                const DELETE_BTN = jQuery('<a class="btn btn-sm btn-danger text-white">' + 
                                          '<i class="fa fa-trash-o" aria-hidden="true"></i>' + 
                                          '</a>');
                DELETE_BTN.on('click', function() {

                });
                DELETE_BTN.appendTo( NEW_ITEM_HEADER_BUTTONS );
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
        });
    }
}

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

            ALL_CARDS[ TYPE ].push({
                title: TITLE,
                description: description
            });

            vsckb_refresh_card_view();

            WIN.modal('hide');
        });

        WIN.modal('show');
    });
});

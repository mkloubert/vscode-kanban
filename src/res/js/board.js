
let allCards;
let boardSettings;
let cardDisplayFilter;
let currentUser;
let nextKanbanCardId;
let vsckb_update_card_interval = false;
let vsckb_is_updating_card_creation_times = false;

function vsckb_add_card_unique(cards, cardToAdd) {
    if (vsckb_is_nil(cardToAdd)) {
        return;
    }

    if (vsckb_is_nil(cards)) {
        cards = [];
    }

    const EXISTS = cards.map(c => c.id)
                        .indexOf( cardToAdd.id ) > -1;
    if (!EXISTS) {
        cards.push( cardToAdd );
    }

    return cards;
}

function vsckb_append_card_content(cardContentObj, target, ifAppended) {
    cardContentObj = vsckb_get_card_description( cardContentObj );
    if (cardContentObj) {
        const CARD_CONTENT = vsckb_to_string( cardContentObj.content );
        if ('' !== CARD_CONTENT.trim()) {
            let html;

            switch (vsckb_normalize_str(cardContentObj.mime)) {
                case 'text/markdown':
                    html = vsckb_from_markdown(
                        CARD_CONTENT
                    );
                    break;

                default:
                    html = vsckb_to_string(
                        jQuery('<span />').text(CARD_CONTENT)
                                          .html()
                    ).trim()
                     .split('\n').join('<br />');
                    break;
            }

            if (target) {
                target.append(
                    html
                );    
            }

            if (ifAppended) {
                ifAppended( html );
            }
        }
    }
}

function vsckb_edit_card(i, opts) {
    if (arguments.length < 2) {
        opts = {};
    }

    const CARD_TYPE = opts.cardType;

    const WIN = jQuery('#vsckb-edit-card-modal');
    WIN.modal('hide');

    const WIN_BODY = WIN.find('.modal-body');
    const WIN_HEADER = WIN.find('.modal-header');

    let user;
    if (i.assignedTo) {
        user = i.assignedTo.name;
    }

    let references = i.references;
    if (vsckb_is_nil(references)) {
        references = [];
    }
    references = references.map(r => r);

    const TITLE_FIELD = WIN_BODY.find('#vsckb-edit-card-title');
    TITLE_FIELD.val( vsckb_to_string(i.title) );

    let descriptionOverflow = '';

    let descriptionField;
    vsckb_invoke_for_md_editor('vsckb-edit-card-description', (e) => {
        descriptionField = e;

        let descriptionToSet = '';

        const DESC = vsckb_get_card_description( i.description );
        if (DESC) {
            descriptionToSet = vsckb_to_string(
                DESC.content
            );
        }

        if (descriptionToSet.length > 255) {
            descriptionToSet = descriptionToSet.substr(0, 255);
            descriptionOverflow = descriptionToSet.substr(255);
        }

        descriptionField.editor.setValue( descriptionToSet );
    });

    if ('' === descriptionOverflow.trim()) {
        descriptionOverflow = '';
    }

    let detailsField;
    vsckb_invoke_for_md_editor('vsckb-edit-card-details', (e) => {
        detailsField = e;

        let detailsToSet = '';

        const DETAILS = vsckb_get_card_description( i.details );
        if (DETAILS) {
            detailsToSet = vsckb_to_string(
                DETAILS.content
            );
        }

        if ('' === detailsToSet.trim()) {
            detailsToSet = '';
        }

        let sep = '';
        if (descriptionOverflow.length > 0 && detailsToSet.length > 0) {
            sep = "\n\n";
        }

        detailsField.editor.setValue( descriptionOverflow + sep + detailsToSet );
    });

    const TYPE_FIELD = WIN.find('#vsckb-edit-card-type');
    TYPE_FIELD.val( vsckb_normalize_str(i.type) );

    const PRIO_FIELD = WIN.find('#vsckb-edit-card-prio');
    PRIO_FIELD.val( vsckb_to_string(i.prio).trim() );
    
    const CATEGORY_FIELD = WIN.find('#vsckb-edit-card-category');
    CATEGORY_FIELD.val( vsckb_to_string(i.category).trim() );

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
        
        let type = vsckb_normalize_str( TYPE_FIELD.val() );
        if ('' === type) {
            type = undefined;
        }

        let category = vsckb_to_string( CATEGORY_FIELD.val() ).trim();
        if ('' === category) {
            category = undefined;
        }

        i.assignedTo = vsckb_get_assigned_to_val(ASSIGNED_TO_FIELD);
        i.title = TITLE;
        i.description = vsckb_get_card_description_markdown( descriptionField );
        i.details = vsckb_get_card_description_markdown( detailsField );
        i.prio = PRIO;
        i.type = type;
        i.category = category;
        i.references = references;
        
        vsckb_save_board();

        vsckb_refresh_card_view((ctx) => {
            if (ctx.item !== i) {
                return;
            }

            let oldCard;
            try {
                oldCard = JSON.parse(
                    JSON.stringify(i)
                );
            } catch (e) { }

            vsckb_raise_event('card_updated', {
                card: i,
                column: CARD_TYPE,
                oldCard: oldCard
            });
        });

        WIN.modal('hide');
    });

    // card links / references
    {
        const LINK_LIST_CONTEXT = vsckb_setup_card_link_list(WIN, {
            onLinkCard: (args) => {
                const CARD_ID = vsckb_to_string( args.card.id );
                if ('' !== CARD_ID.trim()) {
                    if (references.indexOf(CARD_ID) < 0) {
                        references.push(CARD_ID);

                        args.resetCardListValue();
                        args.updateList( references );
                    }
                }
            },
            onCardDeleted: (args) => {
                const CARD_ID = vsckb_to_string( args.card.id );
                if ('' !== CARD_ID.trim()) {
                    references = references.filter(r => {
                        return r !== CARD_ID;
                    });

                    args.updateList( references );
                }
            },
            thisCard: i
        });

        LINK_LIST_CONTEXT.updateList( references );
    }

    WIN.modal('show');
}

function vsckb_find_card_by_id(cardId) {
    cardId = vsckb_to_string(cardId);
    
    let matchingCard = false;

    if ('' !== cardId.trim()) {
        vsckb_foreach_card((card) => {
            if (vsckb_to_string(card.id) === cardId) {
                matchingCard = card;
            }
        });
    }

    return matchingCard;
}

function vsckb_find_parent_cards_of(childId) {
    childId = vsckb_to_string(childId);
    
    let parentCards = [];

    if ('' !== childId.trim()) {
        vsckb_foreach_card((card) => {
            if (vsckb_to_string(card.id) === childId) {
                return;
            }

            if (vsckb_is_nil(card.references)) {
                return;
            }

            for (const CARD_REF of card.references) {
                if (CARD_REF === childId) {
                    parentCards = vsckb_add_card_unique(parentCards, card);
                    break;
                }
            }
        });
    }

    return parentCards;
}

function vsckb_foreach_card(action, cards) {
    if (arguments.length < 2) {
        cards = allCards;
    }

    if (cards) {
        let i = -1;
        let ti = -1;

        for (const TYPE in cards) {
            ++ti;

            const CARD_LIST = cards[TYPE];

            if (CARD_LIST) {
                CARD_LIST.forEach((c) => {
                    ++i;

                    if (action) {
                        action(c, i, TYPE, ti);
                    }
                });
            }
        }
    }
}

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

function vsckb_get_card_colors_by_type(cardType, opts) {
    if (arguments.length < 2) {
        opts = {};
    }

    let backgroundPrefix = vsckb_to_string( opts.backgroundPrefix ).trim();
    if ('' === backgroundPrefix) {
        backgroundPrefix = 'bg';
    }

    const COLORS = {
        background: 'info',
        text: 'text-white'
    };

    switch (vsckb_normalize_str(cardType)) {
        case 'bug':
            COLORS.background = 'dark';
            break;

        case 'emergency':
            COLORS.background = 'danger';
            break;

        default:
            COLORS.text = 'text-dark';
            break;
    }

    COLORS.background = backgroundPrefix + '-' + COLORS.background;

    return COLORS;
}

function vsckb_get_card_count() {
    let count = 0;
    vsckb_foreach_card(() => {
        ++count;
    });

    return count;
}

function vsckb_get_card_description(desc) {
    if (!vsckb_is_nil(desc)) {
        if ('object' !== typeof desc) {
            desc = {
                content: desc
            };
        }

        desc = vsckb_clone(desc);

        let mime = vsckb_normalize_str(desc.mime);
        switch (mime) {
            case 'text/markdown':
                break;
                
            default:
                mime = 'text/plain';
                break;
        }

        desc.content = vsckb_to_string(desc.content);
        desc.mime = mime;
    }

    return desc;
}

function vsckb_get_card_description_markdown(field) {
    let description = vsckb_to_string(
        field.editor.getValue()
    );

    if ('' === description.trim()) {
        description = undefined;
    } else {
        description = {
            content: description,
            mime: 'text/markdown'
        };
    }

    return description;
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

function vsckb_open_card_detail_window(i, opts) {
    if (arguments.length < 2) {
        opts = {};
    }

    let detailsHtml = opts.html;

    const WIN = jQuery('#vsckb-card-details-modal');
    WIN.modal('hide');

    const WIN_HEADER = WIN.find('.modal-header');
    WIN_HEADER.attr('class', 'modal-header');

    const WIN_HEADER_COLORS = vsckb_get_card_colors_by_type( i.type );
    WIN_HEADER.addClass( WIN_HEADER_COLORS.background )
              .addClass( WIN_HEADER_COLORS.text );

    const WIN_HEADER_TITLE = WIN_HEADER.find('.modal-title');
    WIN_HEADER_TITLE.text( vsckb_to_string(i.title) );

    const WIN_BODY = WIN.find('.modal-body');
    WIN_BODY.html('');

    const WIN_BODY_BADGE_LIST = jQuery('<div class="vsckb-badge-list" />');

    // column
    {
        let columnBadge = false;
        vsckb_foreach_card((card, cardIndex, cardColumn) => {
            if (card.id !== i.id) {
                return;
            }

            columnBadge = false;
            cardColumn = vsckb_normalize_str(cardColumn);

            switch (cardColumn) {
                case 'done':
                    columnBadge = jQuery('<span class="badge badge-success text-white" />');
                    break;

                case 'in-progress':
                    columnBadge = jQuery('<span class="badge badge-primary text-white" />');
                    break;

                case 'testing':
                    columnBadge = jQuery('<span class="badge badge-warning text-white" />');
                    break;

                case 'todo':
                    columnBadge = jQuery('<span class="badge badge-secondary text-dark" />');
                    break;
            }

            if (false !== columnBadge) {
                columnBadge.addClass('font-weight-bold')
                            .text( cardColumn );
            }
        });

        if (false !== columnBadge) {
            WIN_BODY_BADGE_LIST.append( columnBadge );
        }
    }

    // references
    {
        const REF_CARDS = (i.references || []).map(r => {
            return vsckb_find_card_by_id(r);
        }).filter(c => !vsckb_is_nil(c));

        const PARENT_CARDS = vsckb_find_parent_cards_of( i.id );

        let allLinkedCards = [];
        REF_CARDS.concat( PARENT_CARDS ).forEach(c => {
            vsckb_add_card_unique(allLinkedCards, c);
        });

        if (allLinkedCards.length > 0) {
            vsckb_sort_cards( allLinkedCards ).forEach(rc => {
                const NEW_REF_ITEM = jQuery('<span class="badge badge-pill vsckb-ref-badge" />');
                NEW_REF_ITEM.text(
                    vsckb_to_string(rc.title).trim()
                );
                NEW_REF_ITEM.attr('title', 'Click Here To View Card Details...');

                let refCardType;
                vsckb_foreach_card((c, i, col) => {
                    if (c.id === rc.id) {
                        refCardType = col;
                    }
                });

                NEW_REF_ITEM.click(() => {
                    let refDetailsHtml;
                    vsckb_append_card_content(
                        rc.details, null, (html) => {
                            refDetailsHtml = html;
                        }
                    );

                    vsckb_open_card_detail_window(rc, {
                        cardType: refCardType,
                        html: refDetailsHtml
                    });
                });

                const NEW_REF_ITEM_COLORS = vsckb_get_card_colors_by_type(rc.type, 'badge');
                NEW_REF_ITEM.addClass( NEW_REF_ITEM_COLORS.background );
                NEW_REF_ITEM.addClass( 'text-white' );
                
                NEW_REF_ITEM.appendTo( WIN_BODY_BADGE_LIST );
            });
        }
    }

    WIN_BODY_BADGE_LIST.appendTo( WIN_BODY );

    if (vsckb_is_nil(detailsHtml)) {
        const NO_DETAILS = jQuery('<div class="alert alert-info font-italic text-white" role="alert" />').text(
            'No Details Available'
        );

        WIN_BODY.append( NO_DETAILS );
    } else {
        WIN_BODY.append( detailsHtml );

        vsckb_apply_highlight( WIN_BODY );
    }

    WIN.find('.modal-footer .vsckb-edit-btn').off('click').on('click', () => {
        WIN.modal('hide');

        jQuery('#vsckb-edit-card-modal').attr('vsckb-select-pane', 
                                              'vsckb-edit-card-details-tab-pane');
        
        vsckb_edit_card(i, {
            cardType: opts.cardType
        });
    });

    WIN.modal('show');
}

function vsckb_refresh_card_view(onAdded) {
    try {
        if (false !== vsckb_update_card_interval) {
            clearInterval(vsckb_update_card_interval);
        }
    } catch (e) { }
    finally {
        vsckb_update_card_interval = false;
    }

    nextKanbanCardId = -1;

    let canTrackTime = false;
    let hideTimeTrackingIfIdle = false;

    const BOARD_SETTINGS = boardSettings;
    if (BOARD_SETTINGS) {
        if (!vsckb_is_nil(BOARD_SETTINGS.canTrackTime)) {
            canTrackTime = !!BOARD_SETTINGS.canTrackTime;
        }

        if (!vsckb_is_nil(BOARD_SETTINGS.hideTimeTrackingIfIdle)) {
            hideTimeTrackingIfIdle = !!BOARD_SETTINGS.hideTimeTrackingIfIdle;
        }
    }

    const DISPLAY_FILTER = vsckb_to_string(cardDisplayFilter);
    const DISPLAY_CARD = (card) => {
        if (vsckb_is_nil(card)) {
            return false;
        }
        
        const NOW = moment.utc();

        const GET_MARKDOWN_VALUE = (v) => {
            if (!vsckb_is_nil(v)) {
                if ('object' === typeof v) {
                    v = v.content;
                } else {
                    v = v;
                }

                v = vsckb_to_string(v);
            }

            return v;
        };

        const TO_DATE = (t) => {
            if (t) {
                if (t.isValid()) {
                    t = moment.utc(t.format('YYYY-MM-DD') + ' 00:00:00',
                                   'YYYY-MM-DD HH:mm:ss');
                }
            }

            return t;
        };

        const CARD_TYPE = vsckb_normalize_str(card.type);
        const IS_CATEGORY = (cat) => {
            return vsckb_normalize_str(card.category) === vsckb_normalize_str(cat);
        };
        const IS_BUG = ['bug', 'issue'].indexOf( CARD_TYPE ) > -1;
        const IS_NOTE = ['', 'note', 'task'].indexOf( CARD_TYPE ) > -1;
        const IS_EMERGENCY = ['emergency'].indexOf( CARD_TYPE ) > -1;

        let creationTime = false;
        {
            const CARD_CREATION_TIME = vsckb_to_string(card.creation_time).trim();
            if ('' !== CARD_CREATION_TIME) {
                const TIME = moment(CARD_CREATION_TIME);
                if (TIME.isValid()) {
                    creationTime = vsckb_as_utc( TIME );
                }
            }
        }

        let assignedTo;
        if (card.assignedTo) {
            assignedTo = card.assignedTo.name;
        }

        let prio = parseFloat(
            vsckb_to_string(card.prio).trim()
        );
        if (isNaN(prio)) {
            prio = undefined;
        }

        return vsckb_does_match(DISPLAY_FILTER, {
            funcs: {
                is_after: (date, orEqual) => {
                    date = vsckb_as_local(
                        moment( vsckb_to_string(date) )
                    );
                    orEqual = !!orEqual;

                    if (date.isValid()) {
                        if (false !== creationTime) {
                            const LOCAL_CREATION_TIME = vsckb_as_local(creationTime);

                            return orEqual ? LOCAL_CREATION_TIME.isAfterOrSame( date )
                                           : LOCAL_CREATION_TIME.isAfter( date );
                        }
                    }

                    return false;
                },
                is_assigned_to: (val) => {
                    return vsckb_normalize_str(val) ===
                           vsckb_normalize_str(assignedTo);
                },
                is_before: (date, orEqual) => {
                    date = vsckb_as_utc(
                        moment( vsckb_to_string(date) )
                    );
                    orEqual = !!orEqual;

                    if (date.isValid()) {
                        if (false !== creationTime) {
                            return orEqual ? creationTime.isBeforeOrSame( date )
                                           : creationTime.isBefore( date );
                        }
                    }

                    return false;
                },
                is_cat: IS_CATEGORY,
                is_category: IS_CATEGORY,
                is_older: (days, orEqual) => {
                    days = parseFloat( vsckb_to_string(days).trim() );
                    orEqual = !!orEqual;

                    if (false !== creationTime) {
                        const DIFF = TO_DATE(NOW).diff(TO_DATE(creationTime),
                                                       'days');

                        return orEqual ? DIFF >= days
                                       : DIFF > days;
                    }

                    return false;
                },
                is_younger: (days, orEqual) => {
                    days = parseFloat( vsckb_to_string(days).trim() );
                    orEqual = !!orEqual;

                    if (false !== creationTime) {
                        const DIFF = TO_DATE(NOW).diff(TO_DATE(creationTime),
                                                       'days');

                        return orEqual ? DIFF <= days
                                       : DIFF < days;
                    }

                    return false;
                }
            },
            values: {
                assigned_to: assignedTo,
                cat: card.category,
                category: card.category,
                description: GET_MARKDOWN_VALUE(card.description),
                details: GET_MARKDOWN_VALUE(card.details),
                'false': false,
                id: card.id,
                is_bug: IS_BUG,
                is_emerg: IS_EMERGENCY,
                is_emergency: IS_EMERGENCY,
                is_issue: IS_BUG,
                is_note: IS_NOTE,
                is_task: IS_NOTE,
                no: false,
                now: vsckb_as_local( NOW ).unix(),
                'null': null,
                prio: prio,
                priority: prio,
                tag: card.tag,
                time: false !== creationTime ? creationTime.unix()
                                             : false,
                title: card.title,
                'true': true,
                type: CARD_TYPE,
                'undefined': undefined,
                utc: NOW.unix(),
                yes: true
            }
        });
    };

    for (const TYPE in allCards) {
        const CARD = jQuery(`#vsckb-card-${ TYPE }`);
        const CARD_BODY = CARD.find('.vsckb-primary-card-body');

        CARD_BODY.html('');

        vsckb_get_cards_sorted(TYPE).forEach((i) => {
            let itemSetup = false;

            ++nextKanbanCardId;

            const CARD_TYPE = TYPE;

            const NEW_ITEM = jQuery('<div class="vsckb-kanban-card border border-dark">' +
                                    '<div class="vsckb-kanban-card-col vsckb-kanban-card-type font-weight-bold" />' + 
                                    '<div class="vsckb-kanban-card-info bg-white text-dark">'  +
                                    '<div class="vsckb-kanban-card-title font-weight-bold" />'  +
                                    '<div class="vsckb-kanban-card-category" />'  +
                                    '<div class="vsckb-kanban-card-progress" />' + 
                                    '<div class="vsckb-kanban-card-body" />'  +
                                    '</div>'  +
                                    '<div class="vsckb-kanban-card-footer text-dark">' +
                                    '<div class="vsckb-buttons float-right" />' + 
                                    '</div>'  +
                                    '</div>');

            const NEW_ITEM_TYPE = NEW_ITEM.find('.vsckb-kanban-card-type');

            const NEW_ITEM_INFO = NEW_ITEM.find('.vsckb-kanban-card-info');
            const NEW_ITEM_INFO_BODY = NEW_ITEM_INFO.find('.vsckb-kanban-card-body');

            const NEW_ITEM_CATEGORY = NEW_ITEM.find('.vsckb-kanban-card-category');
            NEW_ITEM_CATEGORY.hide();

            const NEW_ITEM_PROGRESS = NEW_ITEM.find('.vsckb-kanban-card-progress');
            NEW_ITEM_PROGRESS.hide();

            NEW_ITEM.find('.vsckb-kanban-card-info');

            const NEW_ITEM_COLORS = vsckb_get_card_colors_by_type( i.type );
            NEW_ITEM.find('.vsckb-kanban-card-type')
                    .addClass( NEW_ITEM_COLORS.background )
                    .addClass( NEW_ITEM_COLORS.text );

            // track time button
            if (canTrackTime) {
                let showTrackTimeButton = true;

                if (hideTimeTrackingIfIdle) {
                    if (['todo', 'done'].indexOf(CARD_TYPE) > -1) {
                        showTrackTimeButton = false;
                    }
                }

                if (showTrackTimeButton) {
                    const TRACK_TIME_BTN = jQuery('<a class="btn btn-sm" title="Track Time">' + 
                                                  '<i class="fa fa-clock-o" aria-hidden="true"></i>' + 
                                                  '</a>');
                    
                    TRACK_TIME_BTN.on('click', function() {
                        vsckb_raise_event('track_time', {
                            card: i,
                            column: CARD_TYPE
                        });
                    });

                    TRACK_TIME_BTN.appendTo( NEW_ITEM_TYPE );
                }
            }

            // edit button
            const EDIT_BTN = jQuery('<a class="btn btn-sm" title="Edit Card">' + 
                                    '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>' + 
                                    '</a>');

            {
                EDIT_BTN.on('click', function() {
                    vsckb_edit_card(i, {
                        cardType: CARD_TYPE
                    });
                });

                EDIT_BTN.appendTo( NEW_ITEM_TYPE );
            }

            // delete button
            const DELETE_BTN = jQuery('<a class="btn btn-sm" title="Delete Card">' + 
                                      '<i class="fa fa-trash" aria-hidden="true"></i>' + 
                                      '</a>');
            {
                DELETE_BTN.on('click', function() {
                    const WIN = jQuery('#vsckb-delete-card-modal');

                    WIN.find('.modal-footer .vsckb-no-btn').off('click').on('click', function() {
                        WIN.modal('hide');
                    });

                    WIN.find('.modal-footer .vsckb-yes-btn').off('click').on('click', function() {
                        vsckb_remove_item(i);
                        
                        vsckb_save_board();

                        vsckb_refresh_card_view((ctx) => {
                            if (ctx.item !== i) {
                                return;
                            }

                            vsckb_raise_event('card_deleted', {
                                card: i,
                                column: CARD_TYPE
                            });
                        });
                        
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

                DELETE_BTN.appendTo( NEW_ITEM_TYPE );
            }

            NEW_ITEM_INFO.find('.vsckb-kanban-card-title')
                         .text( vsckb_to_string(i.title).trim() );

            let category = vsckb_to_string(i.category).trim();
            if ('' !== category) {
                NEW_ITEM_CATEGORY.text( category );
                NEW_ITEM_CATEGORY.show();
            }

            vsckb_append_card_content(
                i.description, NEW_ITEM_INFO_BODY,
                () => {
                    itemSetup = () => {
                        vsckb_apply_highlight(
                            NEW_ITEM_INFO_BODY
                        );

                        vsckb_apply_mermaid( NEW_ITEM_INFO_BODY );
                    };
                }
            );

            let detailsHtml;
            vsckb_append_card_content(
                i.details, null, (html) => {
                    detailsHtml = html;
                }
            );
            {
                NEW_ITEM_INFO.on('click', function() {
                    vsckb_open_card_detail_window(i, {
                        cardType: CARD_TYPE,
                        html: detailsHtml
                    });
                });

                NEW_ITEM_INFO.attr('title', 'Click Here To View Details ...');
            }

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

            if (false !== itemSetup) {
                itemSetup();
            }

            // progress bar5
            {
                const TEMP = jQuery('<span>' + 
                                    '<div class="vsckb-description" />' + 
                                    '<div class="vsckb-details" />' + 
                                    '</span>');
                const TEMP_DESCRIPTION = TEMP.find('.vsckb-description');
                const TEMP_DETAILS = TEMP.find('.vsckb-details');

                vsckb_append_card_content(i.description, TEMP_DESCRIPTION, () => {
                    vsckb_apply_highlight( TEMP_DESCRIPTION );
                });
                vsckb_append_card_content(i.details, TEMP_DETAILS, () => {
                    vsckb_apply_highlight( TEMP_DETAILS );
                });

                // task items
                const ALL_TASK_ITEMS = TEMP.find('ul.vsckb-task-list li.task-list-item input[type="checkbox"]');
                if (ALL_TASK_ITEMS.length > 0) {
                    let checkItems = 0;
                    ALL_TASK_ITEMS.each(function() {
                        const TASK_ITEM = jQuery(this);

                        if (TASK_ITEM.prop('checked')) {
                            ++checkItems;
                        }
                    });

                    if (checkItems > 0) {
                        const PERCENTAGE = checkItems / ALL_TASK_ITEMS.length * 100.0;

                        const NEW_ITEM_PROGRESS_BAR = jQuery('<div class="vsckb-kanban-card-progress-bar" />');
                        NEW_ITEM_PROGRESS_BAR.css('width', Math.floor(PERCENTAGE) + '%');

                        if (PERCENTAGE < 50.0) {
                            NEW_ITEM_PROGRESS_BAR.addClass('bg-danger');
                        } else if (PERCENTAGE < 100.0) {
                            NEW_ITEM_PROGRESS_BAR.addClass('bg-warning');
                        } else {
                            NEW_ITEM_PROGRESS_BAR.addClass('bg-success');
                        }

                        NEW_ITEM_PROGRESS_BAR.appendTo( NEW_ITEM_PROGRESS );

                        NEW_ITEM_PROGRESS.attr('title', `${ PERCENTAGE.toFixed(1) } %`);
                        NEW_ITEM_PROGRESS.show();
                    }
                }

                TEMP.remove();
            }

            if (onAdded) {
                onAdded({
                    element: NEW_ITEM,
                    item: i,
                    type: CARD_TYPE
                });
            }

            if (!DISPLAY_CARD(i)) {
                NEW_ITEM.hide();
            }
        });
    }

    vsckb_update_card_creation_times();

    vsckb_update_card_interval = setInterval(() => {
        vsckb_update_card_creation_times();
    }, 20000);
}

function vsckb_reload_board() {
    vsckb_post(
        'reloadBoard'
    );
}

function vsckb_remove_item(item) {
    const ALL_CARS = allCards;

    if (ALL_CARS) {
        for (const CARD_TYPE in ALL_CARS) {
            ALL_CARS[CARD_TYPE] = ALL_CARS[CARD_TYPE].filter(x => x !== item);
        }    
    }
}

function vsckb_save_board() {
    const ALL_CARDS = vsckb_clone(
        allCards
    );

    vsckb_foreach_card((card) => {
        delete card['__uid'];
    }, ALL_CARDS);

    vsckb_post('saveBoard',
               ALL_CARDS);
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

function vsckb_setup_card_link_list(win, opts) {
    if (!opts) {
        opts = {};
    }

    const TAB_PANE = win.find('.vsckb-card-references-tab-pane');

    const CARD_LIST = TAB_PANE.find('.vsckb-card-list');
    CARD_LIST.html('<option value="">----- Select A Card -----</option>');

    const LINKED_CARDS = TAB_PANE.find('.vsckb-list-of-linked-cards');
    LINKED_CARDS.html('');

    const LINK_BTN = TAB_PANE.find('.vsckb-add-link-to-card-btn');

    let otherCards = [];
    vsckb_foreach_card((card, index, column) => {
        if (opts.thisCard) {
            if (opts.thisCard.id === card.id) {
                return;
            }
        }

        otherCards.push({
            card: card,
            column: column,
            index: index
        });
    });

    otherCards = vsckb_sort_cards(otherCards, entry => entry.card);
    otherCards.forEach(entry => {
        const NEW_OPTION = jQuery('<option />');
        NEW_OPTION.text( vsckb_to_string(entry.card.title).trim() );
        NEW_OPTION.val( entry.card.id );
        NEW_OPTION.attr( 'title', vsckb_to_string(entry.card.column) );

        NEW_OPTION.appendTo( CARD_LIST );
    });

    const UPDATE_LIST = function(references) {
        if (vsckb_is_nil(references)) {
            references = [];
        }

        references = references.filter(r => {
            if ('' === vsckb_to_string(r).trim()) {
                return false;
            }

            if (opts.thisCard) {
                if (references.indexOf( vsckb_to_string(opts.thisCard.id) ) > -1) {
                    return false;
                }
            }

            return true;
        });

        LINKED_CARDS.html('');

        if (references.length > 0) {
            vsckb_sort_cards(
                references.map(r => {
                    return vsckb_find_card_by_id(r);
                })
            ).forEach(c => {
                const NEW_REF_ITEM = jQuery('<span class="badge badge-pill vsckb-ref-badge" />');
                NEW_REF_ITEM.text(
                    vsckb_to_string(c.title).trim()
                );
                NEW_REF_ITEM.attr('title', 'Click Here To Remove...');

                NEW_REF_ITEM.click(() => {
                    NEW_REF_ITEM.remove();

                    if (opts.onCardDeleted) {
                        opts.onCardDeleted({
                            card: c,
                            updateList: UPDATE_LIST
                        });
                    }
                });

                const NEW_REF_ITEM_COLORS = vsckb_get_card_colors_by_type(c.type, 'badge');
                NEW_REF_ITEM.addClass( NEW_REF_ITEM_COLORS.background );
                NEW_REF_ITEM.addClass( 'text-white' );

                NEW_REF_ITEM.appendTo( LINKED_CARDS );
            });
        } else {
            const ALERT = jQuery('<div class="alert alert-info" role="alert" />');
            ALERT.text('There Is Currently No Card Linked');

            ALERT.appendTo( LINKED_CARDS );
        }
    };

    LINK_BTN.off('click').on('click', function() {
        const SELECTED_CARD_ID = vsckb_to_string( CARD_LIST.val() );
        if ('' === SELECTED_CARD_ID.trim()) {
            return;
        }

        const SELECTED_CARD = vsckb_find_card_by_id(SELECTED_CARD_ID);
        if (!SELECTED_CARD) {
            return;
        }

        if (opts.onLinkCard) {
            opts.onLinkCard({
                card: SELECTED_CARD,
                resetCardListValue: () => {
                    CARD_LIST.val('');
                },
                updateList: UPDATE_LIST
            });
        }
    });

    return {
        updateList: UPDATE_LIST
    };
}

function vsckb_sort_cards(items, cardSelector) {
    if (arguments.length < 2) {
        cardSelector = (c) => c;
    }

    return (items || []).filter(i => {
        return !vsckb_is_nil(i) &&
               !vsckb_is_nil( cardSelector(i) );
    }).sort((x, y) => {
        x = cardSelector(x);
        y = cardSelector(y);

        // first by title
        const COMP_0 = vsckb_get_sort_val(vsckb_normalize_str(x.title),
                                          vsckb_normalize_str(y.title));
        if (0 !== COMP_0) {
            return COMP_0;
        }

        // then by creation time
        const COMP_1 = vsckb_get_sort_val(vsckb_normalize_str(x.creation_time),
                                          vsckb_normalize_str(y.creation_time));
        if (0 !== COMP_1) {
            return COMP_1;
        }

        return 0;
    });
}

function vsckb_update_card_creation_times() {
    if (vsckb_is_updating_card_creation_times) {
        return;
    }

    vsckb_is_updating_card_creation_times = true;
    try {
        jQuery('.vsckb-kanban-card .vsckb-kanban-card-footer .vsckb-creation-time').each(function() {
            try {
                const CREATION_TIME = jQuery(this);
                CREATION_TIME.hide();
                CREATION_TIME.html('');
                CREATION_TIME.attr('title', '');

                let time = vsckb_to_string( CREATION_TIME.attr('vsckb-time') ).trim();
                if ('' !== time) {
                    time = moment.utc(time);
                    if (time.isValid()) {
                        CREATION_TIME.text(
                            vsckb_to_pretty_time(time)
                        );
                        CREATION_TIME.attr('title',
                                           time.local().format('YYYY-MM-DD HH:mm:ss'));

                        CREATION_TIME.show();
                    }
                }
            } catch (e) { }
        });
    } finally {
        vsckb_is_updating_card_creation_times = false;
    }
}

function vsckb_update_card_item_footer(item, entry) {
    const CARD = item.parents('.vsckb-card');
    const CARD_ID = CARD.attr('id');
    const CARD_TYPE = CARD_ID.substr(11);

    const ITEM_FOOTER = item.find('.vsckb-kanban-card-footer');
    const ITEM_FOOTER_BUTTONS = ITEM_FOOTER.find('.vsckb-buttons');

    ITEM_FOOTER.hide();
    ITEM_FOOTER_BUTTONS.html('');

    const MOVE_CARD = (target) => {
        vsckb_remove_item(entry);
        allCards[target].push(entry);
        
        vsckb_save_board();

        vsckb_refresh_card_view((ctx) => {
            if (ctx.item !== entry) {
                return;
            }

            vsckb_raise_event('card_moved', {
                card: ctx.item,
                from: CARD_TYPE,
                to: target
            });
        });        
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

    let creation_time = vsckb_to_string(entry.creation_time).trim();
    if ('' !== creation_time) {
        try {
            creation_time = moment.utc(creation_time);
            if (creation_time.isValid()) {
                const CREATION_TIME_AREA = jQuery('<div class="vsckb-creation-time float-left" />');
                CREATION_TIME_AREA.attr('vsckb-time',
                                        creation_time.toISOString());

                CREATION_TIME_AREA.appendTo( ITEM_FOOTER );
            }
        } catch (e) { }
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
        const CURRENT_LIST = allCards['done'];

        allCards['done'] = [];

        vsckb_save_board();

        vsckb_raise_event('column_cleared', {
            cards: CURRENT_LIST,
            column: 'done'
        });

        vsckb_refresh_card_view();

        WIN.modal('hide');
    });
});

jQuery(() => {
    const WIN = jQuery('#vsckb-add-card-modal');
    
    const TITLE_FIELD = WIN.find('#vsckb-new-card-title');

    let descriptionField;
    vsckb_invoke_for_md_editor('vsckb-new-card-description', (e) => {
        descriptionField = e;
    });

    TITLE_FIELD.off('keyup').on('keyup', function(e) {
        if (13 == e.which) {
            e.preventDefault();
            descriptionField.editor.focus();

            return;
        }
    });

    WIN.on('shown.bs.modal', function (e) {
        jQuery('a[href="#vsckb-new-card-description-tab-pane"]').tab('show');

        TITLE_FIELD.focus();
    });
});

jQuery(() => {
    const WIN = jQuery('#vsckb-edit-card-modal');
    
    WIN.on('shown.bs.modal', function (e) {
        let paneToSelect = vsckb_to_string(
            WIN.attr('vsckb-select-pane')
        ).trim();
        
        WIN.removeAttr('vsckb-select-pane');

        if ('' === paneToSelect) {
            paneToSelect = 'vsckb-edit-card-description-tab-pane';
        }

        const TAB_PANE = jQuery('#' + paneToSelect);

        jQuery(`a[href="#${ TAB_PANE.attr('id') }"]`).tab('show');

        TAB_PANE.find('textarea').focus();
    });
});

jQuery(() => {
    jQuery('body main .row .col .vsckb-card .vsckb-buttons .vsckb-add-btn').on('click', function() {
        let references = [];

        const BTN = jQuery(this);

        const CARD = BTN.parent().parent().parent();
        const CARD_TITLE = CARD.find('.vsckb-primary-card-header span.vsckb-title');
        const TYPE = CARD.attr('id').substr(11).toLowerCase().trim();

        const WIN = jQuery('#vsckb-add-card-modal');
        WIN.modal('hide');

        const WIN_BODY = WIN.find('.modal-body');
        const WIN_FOOTER = WIN.find('.modal-footer');
        const WIN_HEADER = WIN.find('.modal-header');
        const WIN_TITLE = WIN_HEADER.find('.modal-title');

        const TITLE_FIELD = WIN_BODY.find('#vsckb-new-card-title');
        TITLE_FIELD.val('');

        let descriptionField;
        vsckb_invoke_for_md_editor('vsckb-new-card-description', (e) => {
            descriptionField = e;

            descriptionField.editor.setValue('');
        });

        let detailsField;
        vsckb_invoke_for_md_editor('vsckb-new-card-details', (e) => {
            detailsField = e;

            detailsField.editor.setValue('');
        });

        const TYPE_FIELD = WIN.find('#vsckb-new-card-type');

        const ASSIGNED_TO_FIELD = WIN.find('#vsckb-new-card-assigned-to');
        const PRIO_FIELD = WIN.find('#vsckb-new-card-prio');

        const CATEGORY_FIELD = WIN.find('#vsckb-new-card-category');
        
        WIN.attr('vsckb-type', TYPE);

        vsckb_win_header_from_card_type(WIN_HEADER, TYPE);

        const WIN_TITLE_TEXT = jQuery('<span>Add Card To <strong class="vsckb-card-title" /></span>');
        WIN_TITLE_TEXT.find('.vsckb-card-title')
                      .text( "'" + CARD_TITLE.text() + "'" );

        WIN_TITLE.html('')
                 .append( WIN_TITLE_TEXT );

        WIN_FOOTER.find('.btn').off('click').on('click', function() {
            const CREATION_TIME = moment.utc();

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

            let type = vsckb_normalize_str( TYPE_FIELD.val() );
            if ('' === type) {
                type = undefined;
            }

            let category = vsckb_to_string( CATEGORY_FIELD.val() ).trim();
            if ('' === category) {
                category = undefined;
            }

            let id = '';
            id += CREATION_TIME.format('YYYYMMDDHHmmss') + '_';
            id += Math.floor(Math.random() * 597923979) + '_';
            id += vsckb_uuid().split('-').join('');

            const NEW_CARD = {
                assignedTo: vsckb_get_assigned_to_val( ASSIGNED_TO_FIELD ),
                category: category,
                creation_time: CREATION_TIME.toISOString(),
                description: vsckb_get_card_description_markdown( descriptionField ),
                details: vsckb_get_card_description_markdown( detailsField ),
                id: id,
                prio: PRIO,
                references: references,
                title: TITLE,
                type: type
            };

            allCards[ TYPE ].push(NEW_CARD);
            
            vsckb_save_board();

            vsckb_refresh_card_view((ctx) => {
                if (ctx.item !== NEW_CARD) {
                    return;
                }

                vsckb_raise_event('card_created', {
                    card: ctx.item,
                    column: TYPE
                });
            });

            WIN.modal('hide');
        });

        // card links / references
        {
            const LINK_LIST_CONTEXT = vsckb_setup_card_link_list(WIN, {
                onLinkCard: (args) => {
                    const CARD_ID = vsckb_to_string( args.card.id );
                    if ('' !== CARD_ID.trim()) {
                        if (references.indexOf(CARD_ID) < 0) {
                            references.push(CARD_ID);

                            args.resetCardListValue();
                            args.updateList( references );
                        }
                    }
                },
                onCardDeleted: (args) => {
                    const CARD_ID = vsckb_to_string( args.card.id );
                    if ('' !== CARD_ID.trim()) {
                        references = references.filter(r => {
                            return r !== CARD_ID;
                        });

                        args.updateList( references );
                    }
                }
            });

            LINK_LIST_CONTEXT.updateList( references );
        }

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
                        allCards = MSG.data.cards;
                        boardSettings = MSG.data.settings;
                        cardDisplayFilter = MSG.data.filter;

                        vsckb_foreach_card((card, i) => {
                            card['__uid'] = `${ i }-${ Math.floor(Math.random() * 597923979) }-${ (new Date()).getTime() }`;
                        }, MSG.data.cards);

                        jQuery('#vsckb-card-filter-expr').val(
                            vsckb_to_string( cardDisplayFilter )
                        );
                        vsckb_refresh_card_view();
                    }
                    break;

                case 'setCardTag':
                    {
                        let saveBoard = false;

                        const TAG_DATA = MSG.data;
                        if (TAG_DATA) {
                            const UID = vsckb_to_string(TAG_DATA.uid).trim();

                            vsckb_foreach_card((card) => {
                                if (card['__uid'] === UID) {
                                    card.tag = TAG_DATA.tag;

                                    saveBoard = true;
                                }
                            });
                        }

                        if (saveBoard) {
                            vsckb_save_board();
                        }
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

                case 'webviewIsVisible':
                    {
                        const CARD_COUNT = vsckb_get_card_count();
                        if (CARD_COUNT < 1) {
                            vsckb_reload_board();
                        } else {
                            vsckb_refresh_card_view();
                        }
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

        SELECT.append('<option value="bug">Bug / issue</option>')
              .append('<option value="emergency">Emergency</option>')
              .append('<option value="" selected>Note / task</option>');
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
    jQuery('#vsckb-reload-board-btn').on('click', function() {
        vsckb_reload_board();
    });

    jQuery('#vsckb-save-board-btn').on('click', function() {
        vsckb_save_board();
    });
});

jQuery(() => {
    const WIN = jQuery('#vsckb-card-details-modal');

    WIN.on('shown.bs.modal', function () {
        vsckb_apply_mermaid(
            WIN.find('.modal-body')
        );
    });
});

jQuery(() => {
    jQuery('#vsckb-filter-cards-btn').on('click', function() {
        const WIN = jQuery('#vsckb-card-filter-modal');

        const FILTER_EXPR = jQuery('#vsckb-card-filter-expr');
        FILTER_EXPR.val( vsckb_to_string(cardDisplayFilter) );

        WIN.find('.vsckb-apply-btn').off('click').on('click', function() {
            const NEW_FILTER = FILTER_EXPR.val();
            cardDisplayFilter = NEW_FILTER;

            vsckb_post('saveFilter',
                       NEW_FILTER);

            WIN.modal('hide');

            vsckb_refresh_card_view();
        });

        WIN.modal('show');
    });
});

jQuery(() => {
    vsckb_post('onLoaded');
});

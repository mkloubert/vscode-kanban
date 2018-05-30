
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

jQuery(() => {
    jQuery('.vsckb-btn-with-known-url').on('click', function() {
        const BTN = jQuery(this);

        const URL_ID = vsckb_normalize_str( BTN.attr('vsckb-url') );
        if ('' === URL_ID) {
            return;
        }

        vsckb_open_url(URL_ID);
    });
});

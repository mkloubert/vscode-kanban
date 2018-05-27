
function vsckb_is_nil(val) {
    return null === val ||
           'undefined' === typeof val;
}

function vsckb_normalize_str(val) {
    return vsckb_to_string(val).toLowerCase().trim();
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

function vsckb_sort_by(arr, sorter) {
    return arr.sort((x, y) => {
        const SORT_X = sorter(x);
        const SORT_Y = sorter(y);

        if (SORT_X !== SORT_Y) {
            if (SORT_X > SORT_Y) {
                return 1;
            } else {
                return -1;
            }
        }

        return 0;
    });
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

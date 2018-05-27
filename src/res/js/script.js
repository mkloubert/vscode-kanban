
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
        return vsckb_get_sort_val(
            sorter(x), sorter(y)
        );
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

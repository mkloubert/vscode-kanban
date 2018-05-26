
function vsckb_is_nil(val) {
    return null === val ||
           'undefined' === typeof val;
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

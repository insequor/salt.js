/*
Ozgur Yuksel, July, 2012
    
*/
(function() {
    function make_salt() {
        return {};
    };

    try {
        define(function() {
            return make_salt();
        });
    }
    catch (e) {
        salt = salt || {};
        salt.operation = make_salt();
    }
})();


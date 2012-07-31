/*
Ozgur Yuksel, July, 2012
    
salt is a simple template framework based on html elements and adding them dynamic behavior
It is developed based on ideas from Florin Dinu
*/

define([], function() {
    return {
        version: {
            major: 0.0
            , minor: 0.1
            , date: '2012/07/15'
        }

        /**
        * As a result of below method "target" inherits "base" 
        * Both parameters refers to the classes given
        */
        , inherit: function(target, base) {
            target.prototype = new base();
            target.prototype.constructor = target;
        }


        //this idea is from: http://stackoverflow.com/questions/6072590/how-to-match-an-empty-dictionary-in-javascript
        //it checks if given dictionary object is empty or not
        , isEmpty: function(ob) {
            for (var i in ob) { return false; }
            return true;
        }


    }
});
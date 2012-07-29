/*
Ozgur Yuksel, July, 2012
    
*/
define(['jquery', 'salt.base', 'salt.event', 'salt.model'], function($, salt) {
    //Find all elements which has an attribute named ml, it goes down in the tree
    //but stops once it finds an ml attribute. This way children of each found element 
    //is handled when their parent gets a viewer
    function findSaltyElement(parent, elements) {
        var root = $(parent);
        if (root.attr('salt'))
            elements.push(root);
        else {
            $.each(root.children(), function(idx, child) {
                findSaltyElement(child, elements);
            });
        }
    }



    salt.view = {
        //return a list of elements which has the salt attribute in them
        //this list contains only the top level elements starting from the given parent
        //if no element found it will return an empty list
        saltyElements: function(parent) {
            if (!parent)
                return [];

            var elements = [];
            var root = $(parent);
            findSaltyElement(root, elements);
            return elements;
        }

        , config: function(attr) {
            if (!attr)
                return {};
            var config = {};
            $.each(attr.split(';'), function(pairIdx, pair) {
                pair = pair.split(':');
                config[pair[0]] = pair[1];
            });
            return config;
        }
    };
    return salt;
});

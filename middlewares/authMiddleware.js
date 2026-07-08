function isAuthenticated(req, res, next) {
    if (req.session && req.session.email) {
        return next();
    } else {
        res.redirect('/auth/login');
    }
}

function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.email) {
        res.redirect('/');
    } else {
        return next();
    }
}

function authorize(...user_type){
    return (req, res, next) => {
        if(!req.session || !req.session.user_type || !user_type.includes(req.session.user_type)){
            return res.status(403).render('pages/error', {
                title: "403 - Forbidden",
                message: 'Access Denied : You Shall Not Pass'
            });
        }
        next();
    }
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    authorize
}
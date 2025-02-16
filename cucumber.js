module.exports = {
    default: {
        formatOptions: {
            snippetInterface: 'async-await'
        },
        requireModule: ['@babel/register'],
        require: ['features/step_definitions/*.js']
    }
};
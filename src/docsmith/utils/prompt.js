/* global defaults prompt */
module.exports = {
  repository: defaults
    ? process.env.HOME + '/.content'
    : prompt('Please confirm the location of your content repository', process.env.HOME + '/.content', function(
        response
      ) {
        if (response !== process.env.HOME + '/.content') {
          const er = new Error(
            'Sorry, for now only the `~/.content` folder is supported. Please accept the default value.'
          );
          er.notValid = true;
          return er;
        }
        return response;
      }),
  confirm: defaults
    ? 'yes'
    : prompt('Please confirm initialisation of the workspace in the current directory (no/yes)', 'no', function(
        response
      ) {
        if (typeof response !== 'string' || !response) {
          const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
          er.notValid = true;
          return er;
        } else if (response.toLowerCase() === 'yes') {
          return 'yes';
        } else if (response.toLowerCase() === 'no') {
          return 'no';
        }
        const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
        er.notValid = true;
        return er;
      })
};

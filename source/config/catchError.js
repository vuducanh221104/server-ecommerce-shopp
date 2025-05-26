// Wrapper function to handle async errors in Express middlewares
const CatchError = (fn) => {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { CatchError };
export default CatchError;

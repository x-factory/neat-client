(function() {
  'use strict';

  angular
    .module('neatClient')
    .factory('MapData', MapData);

  /** @ngInject */
  function MapData(
    url,
    $q,
    $log,
    $http
  ) {

    var service = {
      getTypes: getTypes,
      getRecords: getRecords,
      getFilteredRecords: getFilteredRecords,
      createRecord: createRecord,
      updateRecord: updateRecord,
      deleteRecord: deleteRecord
    };

    return service;

    /////////////////////////////////
    // GET
    // /////////////////////////////
    function getTypes() {
      return $http.get(url('/types'))
        .then(getDataComplete('types'))
        .catch(catchErrorFn('XHR getTypes failed'));
    }

    function getRecords() {
      return $http.get(url('/records'))
        .then(getDataComplete('records'))
        .catch(catchErrorFn('XHR getRecords failed'));
    }

    function getFilteredRecords(chosenTypes, severity) {
      var queryStr = '?';

      if (chosenTypes.length > 0) {
        chosenTypes = chosenTypes.join();
        queryStr += 'ftypes=' + chosenTypes;
        queryStr += severity > 0 ? '&' : '';
      }

      if (severity > 0) {
        queryStr += 'fseverity=' + severity;
      }

      return $http.get(url('/records' + queryStr))
        .then(getDataComplete('records'))
        .catch(catchErrorFn('XHR getFilteredRecords failed'));
    }

    /////////////////////////////////
    // Promise Fulfilled / Rejected
    // /////////////////////////////
    function getDataComplete(type) {
      return function complete(data) {
        return data.data[type];
      };
    }

    function actionComplete(data) {
      return data.data;
    }

    function catchErrorFn(errMsg) {

      return function requestFailed(e) {
        var newMessage = errMsg;
        if (e.data && e.data.description) {
          newMessage += '\n' + e.data.description;
        }
        if (e.data) {
          e.data.description = newMessage;
        }
        $log.error(e.data);
        return $q.reject(e);
      };
    }

    /////////////////////////////////
    // POST
    // /////////////////////////////
    function createRecord(record) {
      return $http.post(url('/records'), record)
        .then(actionComplete)
        .catch(catchErrorFn('XHR createRecord failed'));
    }

    /////////////////////////////////
    // PUT
    // /////////////////////////////
    function updateRecord(id, record) {
      return $http.put(url('/record', id), record)
        .then(actionComplete)
        .catch(catchErrorFn(actionErrMsg('updateRecord', id)));
    }

    /////////////////////////////////
    // DELETE
    // /////////////////////////////
    function deleteRecord(id) {
      return $http.delete(url('/record', id))
        .then(actionComplete)
        .catch(catchErrorFn(actionErrMsg('deleteRecord', id)));
    }

    /////////////////////////////////
    // Helpers
    // /////////////////////////////
    function actionErrMsg(name, id) {
      return 'XHR ' + name + ' by ' + id + ' failed';
    }

  }
})();

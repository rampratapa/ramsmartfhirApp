(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
     if (smart.hasOwnProperty('user')) {
       alert(smart.hasOwnProperty('user'));
       var usr =smart.user.read();
       var userType = smart.user.resourceType  ;
       console.log( "userType " + userType);
       console.log( "usr " + JSON.stringify(usr)  );
      // console.log('userId', userId);
     }
 
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });
    var encnt = smart.patient.api.fetchAll({
                    type: 'Encounter',
                     query: {
                      status: {
                        $or: ['cancelled' ]
                      }
                    }
                  });
        
        var covrage = smart.patient.api.fetchAll({
                    type: 'Coverage',
                     query: {
                      patient: {
                        $or: [patient.id ]
                      }
                    }
                  });
        $.when(pt, obv,encnt,covrage).fail(onError);

        $.when(pt, obv,encnt,covrage).done(function(patient, obv,encnt,covrage) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;
          var enct = encnt.id;
          console.log('encnt', encnt);
          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            // fname = patient.name[0].given.join(' ');
            // lname = patient.name[0].family.join(' ');
            fname = patient.name[0].given;
            lname = patient.name[0].family;
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.id =  patient.id;
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          console.log('Coverage-Id', covrage);
          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      id: {value: ''},
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      covId: {value: ''},
      covStatus: {value: ''},
      covSubId: {value: ''},
      covStart: {value: ''},
      covEnd: {value: ''},
      encounter: [{
        id :{value: ''},
        status: {value: ''},
        servicetype:{value:''}
      }]
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#id').html(p.id);
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);

let base64 = require('base-64');
exports = {
  onAppInstallHandler: function () {
    console.log("on app istall call...............................");
    generateTargetUrl().then(function (url) {
      console.log("TARGET URL")
      console.log(url)
      renderData();
    }).fail(function (err) {
      console.log("IN app install generateTargetURl");
      console.error(err);
      renderData(err);
    });
  },
  onExternalEventHandler: function (payload) {
    externalEventPayloadLogs(payload);
    var object = {
      "u_priority": payload.data.priority,
      "u_state": payload.data.status, "u_correlation_id": payload.data.id
    }
    var id_num = payload.data.id.split("-")[1];
    conditionChecksLogs(id_num, payload);
    if (payload.data.custom_fields.initiated_from_fresh_service == 'true' && "subject" in payload.data) {//create problem
      object.u_description = payload.data.description;
      object.u_short_description = payload.data.subject;
      object.u_ticket_type = "Problem";
      console.log('OBJECT PAYLOAD')
      console.log(object)
      createTicketInServicenow(object, id_num, "Problem", payload);
    }
    else otherProblemsEvents(payload, id_num, object);
  }
};
let otherProblemsEvents = function (payload, id_num, object) {
  console.log('other conditions')
  if ("subject" in payload.data === false && Object.keys(payload.data.custom_fields).length === 2) { //note creation
    if (payload.data.custom_fields.initiated_from_fresh_service == 'true' || payload.data.custom_fields.initiated_from_service_now == 'true')
      getProblemNotes(payload.data, id_num, payload);
  } else if (Object.keys(payload.data.custom_fields).length === 1) //problem updated
    searchProblemInDb(payload, object);
}

let searchProblemInDb = function (payload, object) {
  $db.get(`problem:${payload.data.id.split("-")[1]}`).then(function () {
    console.log("PROBLEM ID IS IN DB")
  }, function (error) {
    if (error.status !== 404) {
      console.log('ERROR AT SEARCH PROBLEM IN DB()')
      console.error(error);
    } else {
      createTicketInServicenow(object, payload.data.id.split("-")[1], "Problem", payload);
    }
  });
}
function externalEventPayloadLogs(payload) {
  console.log("EXTERNAL EVEN HITTTED")
  console.log("PAYLOAD DATA")
  console.log(payload.data)
  console.log('PAYLOAD DATA OBJECT LENGTH')
  console.log(Object.keys(payload.data).length)
}
function conditionChecksLogs(id_num, payload) {
  console.log("PROBLEM ID")
  console.log(id_num)
  console.log("PRBLEM CUSTOM FIELDS")
  console.log(payload.data.custom_fields)
  console.log("subject" in payload.data, " <-subject exit")
  console.log("subject" in payload.data === false, " <-not subject exist")
  console.log(payload.data.custom_fields.initiated_from_fresh_service == 'true', " <- initiated_from_fresh_service isTrue?")
  console.log(payload.data.custom_fields.initiated_from_service_now == 'true', " <- initiated_from_service_now isTrue?")
  console.log(payload.data.custom_fields.initiated_from_fresh_service == 'true' && "subject" in payload.data, " <-first if condition")
  console.log("subject" in payload.data === false && Object.keys(payload.data.custom_fields).length === 2, " <-second if condition")
  console.log(Object.keys(payload.data.custom_fields).length === 1, " <-third if condition")
}
function getProblemNotes(w_data, id, args) {
  console.log(" in getProblemNotes()");
  let url = "https://<%= iparam.domain %>/api/v2/problems/" + id + "/notes";
  console.info('PROBLEM NOTES API URL')
  console.log(url)
  const apiKey = '<%= encode(iparam.api_key) %>';
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };

  let options = {
    headers: headers
  }
  $request.get(url, options).then(function (data) {
    try {
      var res = JSON.parse(data.response);
      console.log("NOTES RESPONSE")
      console.log(res.notes)
      res.notes.reverse();
      console.log('AFTER REVERSE APPLIED PROBLEM NOTEST FROM RESPONSE')
      console.log(res.notes)
      console.log("FIRST NOTES FROM RESPONSE")
      console.log(res.notes[0]);
      console.log('BODY TEXT OF NOTE')
      console.log(res.notes[0].body_text)
      var body = res.notes[0].body_text;
      console.log("TYPE OF BODY TEXT")
      console.log(typeof (body));
      var sub_string = body.indexOf("Your request has been received and a ticket reference will be sent shortly.");
      console.log(sub_string, " <-text includes condition")
      if (sub_string === -1)
        createNoteInSn(res.notes[0].body, w_data, args);
    } catch (error) {
      console.log("IN GET PROBLEM NOTES API CATCH BLOCK")
      console.error(error);
    }
  }, function (error) {
    console.log("IN GET PROBLEM NOTES API")
    console.error(error);
  });
}
function createNoteInSn(text, w_data, args) {
  let url = "https://alternativestaging.service-now.com/api/now/table/u_freshservice_ticket";
  console.log('SERVICE NOW API URL')
  console.log(url)
  const apiKey = base64.encode(`${args.iparams.domain_sn}:${args.iparams.apiKeySn}`);
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };
  var objBody = {
    "u_internal_comments": text
  };
  objBody.u_correlation_id = w_data.id;
  let body = JSON.stringify(objBody);
  console.log("REQUEST BODY FOR CREATING A TICKET IN SN")
  console.log(body)
  let options = {
    headers: headers,
    body: body
  }
  $request.post(url, options).then(function () {
    console.log("conv created in sn")
  }, function (error) {
    console.log('IN createNoteInSn()')
    console.error(error);
  });
}
function createTicketInServicenow(objBody, ticket_id, type, args) {
  let url = "https://alternativestaging.service-now.com/api/now/table/u_freshservice_ticket";
  console.log('SERVICE NOW API URL')
  console.log(url)
  const apiKey = base64.encode(`${args.iparams.domain_sn}:${args.iparams.apiKeySn}`);
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };
  let body = JSON.stringify(objBody);
  let options = {
    headers: headers,
    body: body
  }
  $request.post(url, options).then(function (data) {
    console.log("created ticket in sn")
    console.log(data)
    let res = JSON.parse(data.response);
    let sys_id = res.result.sys_id;
    let num = res.result.u_daisy_ticket_number;
    console.log(sys_id, num, "<- SYS ID, NUM");
    if (type === "Problem")
      updateProblemField(ticket_id, num, sys_id, type);
    else
      createPrivateNoteInFs(ticket_id, num, sys_id);
  }, function (error) {
    console.log('IN createTicketInServicenow()')
    console.error(error);
  });
}
function createPrivateNoteInFs(id, num, sys_id) {
  let url = "https://<%= iparam.domain %>/api/v2/tickets/" + id + "/notes";
  const apiKey = '<%= encode(iparam.api_key) %>';
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };
  var bodyobj = {
    "private": true,
    "body": "3rd Party Reference: " + num, "incoming": true
  };
  let body = JSON.stringify(bodyobj);
  let options = {
    headers: headers,
    body: body
  }
  $request.post(url, options).then(function () {
    console.log("created comment in fs")
    linkSnTicketToFs(sys_id, id, num);
  }, function (error) {
    console.log("in createPrivateNoteInFs()")
    console.error(error);
  });
}
function updateProblemField(ticket_id, num, sys_id, type) {
  console.log("in updateProblemField().................")
  let url = "";
  const apiKey = '<%= encode(iparam.api_key) %>';
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };
  var obj = {};
  if (type === "Problem") {
    url = "https://<%= iparam.domain %>/api/v2/problems/" + ticket_id;
    obj.custom_fields = {};
    obj.custom_fields["thirdparty_reference"] = num;
    obj.custom_fields["thirdparty_organisation"] = "Daisy";
  } else {
    url = "https://<%= iparam.domain %>/api/v2/tickets/" + ticket_id;
    obj.custom_fields = {};
    obj.custom_fields["cf_3rd_party_reference"] = num;
  }
  console.log("REQUEST BODY")
  console.log(obj);
  console.log('UPDATE TICKET FIELDS API URL')
  console.log(url);
  let body = JSON.stringify(obj);
  let options = {
    headers: headers,
    body: body
  };
  $request.put(url, options).then(function () {
    linkSnTicketToFs(sys_id, ticket_id, num);
  }, function (error) {
    console.log("in updateProblemField()")
    console.error(error);
  });
}


function linkSnTicketToFs(sys_id, ticket_id, number) {
  $db.set(`problem:${ticket_id}`, { id: sys_id, "number": number }).then(function () {
    console.log("Service Now Ticket is linked to FS");
  }, function (e) {
    console.log("in linkSnTicketToFs()...");
    console.error(e.message);
  });
}
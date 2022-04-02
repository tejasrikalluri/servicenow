let base64 = require('base-64');
exports = {
  onTicketCreateHandler: function (args) {
    console.log("ticket created event hitted")
    console.log("___________________ custom fields of ticket------------------------")
    for (var i = 0; i < args.data.ticket.custom_fields.length; i++) {
      console.log(args.data.ticket.custom_fields[i].name, args.data.ticket.custom_fields[i].value)
      if (args.data.ticket.custom_fields[i].name === "daisy_service_now_integration" && args.data.ticket.custom_fields[i].value) {
        const ticket_id = args.data.ticket.id;
        const subject = args.data.ticket.subject;
        const description = args.data.ticket.description;
        const priority = args.data.ticket.priority;
        const status = args.data.ticket.status;
        var objBody = {
          "u_short_description": subject, "u_ticket_type": args.data.ticket.type_name,
          "u_description": description
        };
        formRemainingBody(objBody, args, ticket_id, priority, status);
      }
    }
    console.log("___________________ custom fields ended------------------------")

  },
  onAppInstallHandler: function () {
    console.log("on app istall call...............................");
    generateTargetUrl().then(function (url) {
      console.log(url)
      renderData();
    }).fail(function (err) {
      console.log("app install generateTargetURl");
      console.log(err);
      renderData(err);
    });
  },
  onExternalEventHandler: function (payload) {
    console.log("EEEEEEEEEEEEEEEEEEeeeeee")
    console.log(payload.data)
    console.log(Object.keys(payload.data).length)
    var object = {
      "u_priority": payload.data.priority,
      "u_state": payload.data.status, "u_correlation_id": payload.data.id
    }
    var id_num = payload.data.id.split("-")[1];
    console.log(id_num)
    console.log(payload.data.custom_fields)
    console.log("subject" in payload.data, " <-subject exit")
    console.log("subject" in payload.data === false, " <-not subject exist")
    console.log(payload.data.custom_fields.initiated_from_fresh_service == 'true', " <- from fs isTrue?")
    console.log(payload.data.custom_fields.initiated_from_service_now == 'true', " <- from sn isTrue?")
    console.log(payload.data.custom_fields.initiated_from_fresh_service == 'true' && "subject" in payload.data, " <-first if condition")
    console.log("subject" in payload.data === false && (payload.data.custom_fields.initiated_from_fresh_service == 'true' || payload.data.custom_fields.initiated_from_service_now == true), " <-second if condition")
    if (payload.data.custom_fields.initiated_from_fresh_service == 'true' && "subject" in payload.data) {//create problem
      object.u_description = payload.data.description;
      object.u_short_description = payload.data.subject;
      object.u_ticket_type = "Problem";
      console.log(object)
      createTicketInServicenow(object, id_num, "Problem", payload);
    }
    else if ("subject" in payload.data === false && (payload.data.custom_fields.initiated_from_fresh_service == 'true' || payload.data.custom_fields.initiated_from_service_now == true)) {
      if (Object.keys(payload.data).length === 2) {
        if (payload.data.custom_fields.initiated_from_fresh_service == 'true' || payload.data.custom_fields.initiated_from_service_now == 'true')
          getProblemNotes(payload.data, id_num, payload);
      }
      else {
        // $db.get(id_num).then(function (data) {
        //   console.log(data)
        //   let sys_id = data.id;
        //   console.log(object)
        //   // updateTicket(sys_id, payload, object);
        // }, function (error) {
        //   console.error(error.message);
        // });
      }


    }

  },
  onTicketUpdateCallback: function (args) {
    console.log("Update event hitted")
    var changes = args.data.ticket.changes;
    let ticket_id = args.data.ticket.id;
    console.log("Changes of custom field")
    console.log(changes)
    console.log("ticket id")
    console.log(ticket_id)
    console.log("ticket type")
    console.log(args.data.ticket.type_name)
    const subject = args.data.ticket.subject;
    const description = args.data.ticket.description;
    const priority = args.data.ticket.priority;
    const status = args.data.ticket.status;

    if ("custom_fields" in changes && args.data.ticket.type_name === "Service Request") {
      var objBody = {
        "u_short_description": subject, "u_ticket_type": args.data.ticket.type_name,
        "u_description": description
      };
      console.log("----------------- custom fields started loop in update event------------")
      for (var i = 0; i < changes.custom_fields.length; i++) {
        console.log(changes.custom_fields[i]);
        console.log(changes.custom_fields[i].name)
        if (changes.custom_fields[i].name === "Initiated from FRESH SERVICE") {
          console.log(changes.custom_fields[i].value)
          console.log(typeof (changes.custom_fields[i].value))
          if (changes.custom_fields[i].value[1] === 'true') {
            checkTicketInDB(ticket_id, objBody, args, priority, status);
          }
        }
      }
      console.log("----------------- custom fields ended loop in update event------------")
    }
    // var body = {};
    // if ("priority" in changes) {
    //   body.u_priority = changes.priority_name[u 1];
    // }
    // if ("status" in changes) {
    //   body.u_state = changes.status_name[1];
    // }
    // for (var i = 0; i < args.data.ticket.custom_fields.length; i++) {
    //   if (args.data.ticket.custom_fields[i].name === "daisy_service_now_integration" || args.data.ticket.custom_fields[i].name === "initiated_from_service_now") {
    //     if (args.data.ticket.custom_fields[i].value) {
    //       $db.get(ticket_id).then(function (data) {
    //         let sys_id = data.id;
    //         updateTicket(sys_id, args, body);
    //       }, function (error) {
    //         console.error(error.message);
    //       });
    //     }
    //   }
    // }
  },
  onConversationCreateCallback: function (payload) {
    console.log("conversation event hitted")
    var conv = payload.data.conversation;
    console.log(conv.incoming, conv.private, "incoming value,", "private?")
    console.log("----------------CONV BODY---------------------")
    console.log(conv.body)
    if (conv.incoming === false && conv.private === true) {
      getTicketDetails(conv, payload, conv.incoming);
    }
    else if (conv.incoming && conv.private && conv.body.indexOf("Please re-apply manually") != -1) {
      getTicketDetails(conv, payload, conv.incoming);
      console.log("else if success")
    }
  }
};
var map_fields = function (callback) {
  var headers = { "Authorization": "Basic <%= encode(iparam.api_key) %>" };
  var options = { headers: headers };
  var url = `https://<%= iparam.domain %>/api/v2/ticket_fields`;
  $request.get(url, options).then(function (data) {
    try {
      var resp = JSON.parse(data.response);
      callback(resp)
    } catch (error) {
      console.error(error);
    }
  }, function (error) {
    console.error(error);
  });
}
function getProblemNotes(w_data, id, args) {
  console.log(" in 134");
  let url = "https://<%= iparam.domain %>/api/v2/problems/" + id + "/notes";
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
      console.log(res.notes)
      res.notes.reverse();
      console.log(res.notes)
      console.log(res.notes[0]);
      console.log(res.notes[0].body_text)
      var body = res.notes[0].body_text;
      console.log(typeof (body));
      var sub_string = body.indexOf("(Customer Facing Comments)");
      console.log(sub_string, " <-text includes condition")
      if (sub_string === -1) {
        createNoteInSn(res.notes[0].body, w_data, args);
      }



      // console.log(res.ticket);
      // console.log(res.ticket.type);
      // console.log(res.ticket.custom_fields)
      // for (const property in res.ticket.custom_fields) {
      //   console.log(property);
      //   if (property === "daisy_service_now_integration" || property === "initiated_from_service_now") {
      //     console.info(property, res.ticket.custom_fields[property]);
      //     if (res.ticket.custom_fields[property] === true) {
      //       createCommentsInSn(conv, args, res.ticket.type);
      //       // checkTicketId(conv, args, res.ticket.type);
      //     }
      //   }
      // }

    } catch (error) {
      console.error(error);
    }
  }, function (error) {
    console.error(error);
  });
}
function createNoteInSn(text, w_data, args) {
  let url = "https://daisygroup.service-now.com/api/now/table/u_freshservice_ticket";
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
  console.log(body)
  let options = {
    headers: headers,
    body: body
  }
  $request.post(url, options).then(function () {
    console.log("conv created in sn")
  }, function (error) {
    console.error(error);
  });
}
function checkTicketInDB(ticket_id, objBody, args, priority, status) {
  $db.get(ticket_id).then(function () {
    console.info("Record already there for SR");
  }, function (e) {
    if (e.status !== 404)
      console.error(e.message);
    else {
      formRemainingBody(objBody, args, ticket_id, priority, status)
      // createTicketInServicenow(objBody, ticket_id, type, args);
    }
  });
}
function formRemainingBody(objBody, args, ticket_id, priority, status) {
  var statusMap = {}, priorityMap = {};
  map_fields(function (t_fields) {
    for (var i = 0; i < t_fields.ticket_fields.length; i++) {
      if (t_fields.ticket_fields[i].name === "status") {
        for (const property in t_fields.ticket_fields[i].choices) {
          var val = property, statusText = t_fields.ticket_fields[i].choices[property][0];
          statusMap[val] = statusText;
        }
      }
      if (t_fields.ticket_fields[i].name === "priority") {
        for (const property in t_fields.ticket_fields[i].choices) {
          var val = property, priorityText = t_fields.ticket_fields[i].choices[property];
          priorityMap[priorityText] = property;

        }
      }
    }
    objBody["u_priority"] = priorityMap[priority];
    objBody["u_state"] = statusMap[status];
    console.log(args.data.ticket.type_name)
    if (args.data.ticket.type_name === "Incident") {
      objBody["u_correlation_id"] = "INC-" + ticket_id.toString();

    } else {
      objBody["u_correlation_id"] = "SR-" + ticket_id.toString();
    }
    console.log(objBody)
    createTicketInServicenow(objBody, ticket_id, args.data.ticket.type_name, args);
  });

}
function getTicketDetails(conv, args, incoming) {
  let url = "https://<%= iparam.domain %>/api/v2/tickets/" + conv.ticket_id + "?include=conversations";
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
      console.log("ticket payload")
      console.log(res.ticket);
      console.log("ticket type")
      console.log(res.ticket.type);
      console.log("ticket custom fields")
      console.log(res.ticket.custom_fields)
      console.log("--------------------ticket fields names loop started------------------")
      for (const property in res.ticket.custom_fields) {
        console.log(property);
        if (property === "daisy_service_now_integration" || property === "initiated_from_service_now") {
          console.info(property, res.ticket.custom_fields[property]);
          if (res.ticket.custom_fields[property] === true && !incoming) {
            createCommentsInSn(conv, args, res.ticket.type, incoming);
            // checkTicketId(conv, args, res.ticket.type);
          } else if (res.ticket.custom_fields[property] === true && incoming) {
            createCommentsInSn(res.ticket.conversations[0], args, res.ticket.type, incoming);
          }
        }
      }
      console.log("--------------------ticket fields names loop ended------------------")
    } catch (error) {
      console.error(error);
    }
  }, function (error) {
    console.error(error);
  });
}
function createCommentsInSn(conv, args, type, incoming) {
  let url = "https://daisygroup.service-now.com/api/now/table/u_freshservice_ticket";
  console.log(url)
  const apiKey = base64.encode(`${args.iparams.domain_sn}:${args.iparams.apiKeySn}`);
  let headers = {
    "Authorization": `Basic ${apiKey}`,
    "Content-Type": "application/json"
  };
  var objBody = {
    "u_internal_comments": conv.body
  }; if (!incoming)
    objBody.u_correlation_id = (type === "Incident") ? "INC-" + conv.ticket_id : "SR-" + conv.ticket_id;
    else 
    objBody.u_correlation_id = (type === "Incident") ? "INC-" + args.data.conversation.ticket_id : "SR-" + args.data.conversation.ticket_id;
  let body = JSON.stringify(objBody);
  console.log("body")
  console.log(body)
  let options = {
    headers: headers,
    body: body
  }
  $request.post(url, options).then(function () {
    console.log("conv created in sn")
  }, function (error) {
    console.error(error);
  });
}
// function updateTicket(sys_id, args, bodyForm) {
//   let url = ` https://daisygroup.service-now.com/api/now/table/u_freshservice_ticket/${sys_id}`;
//   console.log(url);
//   const apiKey = base64.encode(`${args.iparams.domain_sn}:${args.iparams.apiKeySn}`);
//   let headers = {
//     "Authorization": `Basic ${apiKey}`,
//     "Content-Type": "application/json"
//   };

//   let options = {
//     headers: headers,
//     body: JSON.stringify(bodyForm)
//   };

//   $request.put(url, options).then(function (data) {
//     console.log("updated in sn");
//     console.log(data);
//   }, function (error) {
//     console.error(error);
//   });
// }
function createTicketInServicenow(objBody, ticket_id, type, args) {
  let url = "https://daisygroup.service-now.com/api/now/table/u_freshservice_ticket";
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
    console.log(sys_id, num);
    if (type === "Incident" || type === "Problem")
      updateTicketField(ticket_id, num, sys_id, type);
    else
      createPrivateNoteInFs(ticket_id, num, sys_id);
  }, function (error) {
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
    console.log("created comments in fs")
    linkSnTicketToFs(sys_id, id, num);
  }, function (error) {
    console.error(error);
  });
}
function updateTicketField(ticket_id, num, sys_id, type) {
  console.log("in update.................")
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
  console.log(obj);
  console.log(url);
  let body = JSON.stringify(obj);
  let options = {
    headers: headers,
    body: body
  };
  $request.put(url, options).then(function () {
    linkSnTicketToFs(sys_id, ticket_id, num);
  }, function (error) {
    console.error(error);
  });
}


function linkSnTicketToFs(sys_id, ticket_id, number) {
  $db.set(ticket_id, { id: sys_id, "number": number }).then(function () {
    console.log("Service Now Ticket is linked to FS");
  }, function (e) {
    console.log("in linkSnTicketToFs()...");
    console.error(e.message);
  });
}
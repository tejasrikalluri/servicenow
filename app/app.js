$(document).ready(function () {
    app.initialized().then(function (_client) {
        var client = _client;
        client.events.on('app.activated', function () {
            // var propertyChangeCallback = function (event) {
            //     var event_data = event.helper.getData();
            //     console.log(event_data)
            //     var body = {};
            //     if ("priority" in event_data || "status" in event_data) {
            //         if ("priority" in event_data) {
            //             body.u_priority = event_data.priority.name;
            //         }
            //         if ("status" in event_data) {
            //             body.u_state = event_data.status.name;
            //         }
            //         getTicketDetails(client, function (t_data) {
            //             console.log(t_data);
            //             body.u_correlation_id = (t_data.ticket_type === "Incident") ? "INC-" + t_data.display_id : "SR-" + t_data.display_id;
            //             console.log(t_data.custom_field.daisy_service_now_integration_387496, t_data.custom_field.initiated_from_service_now_387496);
            //             if (t_data.custom_field.daisy_service_now_integration_387496 === true || t_data.custom_field.initiated_from_service_now_387496 === true) {
            //                 checkTicketInDB(client, body, t_data);
            //             }
            //         });
            //     }
            //     console.log(body);

            // };
            // client.events.on("ticket.propertiesUpdated", propertyChangeCallback);

        }, function (error) {
            console.error(error);
        });
    }, function (error) {
        console.error(error);
    });
    // var getTicketDetails = function (client, callback) {
    //     client.data.get("ticket").then(function (data) {
    //         // console.log(data)
    //         callback(data.ticket);
    //     }, function (error) {
    //         console.error(error);
    //     });
    // }
    // function checkTicketInDB(client, body, t_data) {
    //     client.db.get(t_data.display_id).then(function (data) {
    //         let sys_id = data.id;
    //         console.log(sys_id)
    //         updateTicket(sys_id, body, client);
    //     }, function (error) {
    //         console.error(error.message);
    //     });
    // }
    // var getIparamsData = function (client, callback) {
    //     client.iparams.get().then(function (data) {
    //         callback(data);
    //     }, function (error) {
    //         console.error(error.message);
    //     });
    // }
    // function updateTicket(sys_id, bodyForm, client) {
    //     let url = `https://alternativestaging.service-now.com/api/now/table/u_freshservice_ticket/${sys_id}`;
    //     console.log(url);
    //     getIparamsData(client, function (iData) {
    //         const apiKey = btoa(`${iData.domain_sn}:${iData.apiKeySn}`);
    //         console.log(iData)
    //         let headers = {
    //             "Authorization": `Basic ${apiKey}`,
    //             "Content-Type": "application/json"
    //         };

    //         let options = {
    //             headers: headers,
    //             body: JSON.stringify(bodyForm)
    //         };

    //         client.request.put(url, options).then(function (data) {
    //             console.log("updated in sn");
    //             console.log(data);
    //         }, function (error) {
    //             console.error(error);
    //         });
    //     });

    // }
});
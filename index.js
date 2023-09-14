/**
 * Will take the active revision of the specified Cloud Run service and check if the GTM image sha 
 * is the same as the latest stable version of the GTM image. 
 * In case of mismatch a new revision will be created copying the variables and resources from the last active revision.
 * 
 * @param req Post request keys required: project_id, region, service_name
 * @returns The status of the currently deployed Cloud Run service
 */

const functions = require('@google-cloud/functions-framework');
const {RevisionsClient,ServicesClient} = require('@google-cloud/run').v2;
//const {ServicesClient} = require('@google-cloud/run').v2;
const fetch = require('node-fetch')

const runClient = new RevisionsClient();
const service_client = new ServicesClient();

functions.http('check_cloud_run', (req, res) => {

  if(req.body.project_id && req.body.region && req.body.service_name){
    let params = {
        cf_name: "sgtm_image_updater",
        ...req.body
    }
    console.log(params)
    check_cloud_run(params);
  }
  else{
    res.status(500).json({"success":"false","message":"Wrong / Missing Request Body"});
  }

  async function check_cloud_run(params) {

    const parent = `projects/${params.project_id}/locations/${params.region}/services/${params.service_name}`
    const request = {
        parent,
    };
    
    let revisions_list = [];
    let active_revision;

    const iterable = await runClient.listRevisionsAsync(request);
    for await (const response of iterable) {
        revisions_list.push(response)
    }
    for (const revision of revisions_list) {
        for (const condition of revision.conditions) {
            if(condition.type == "Active" && condition.state == "CONDITION_SUCCEEDED") {
                active_revision = revision;
            }
        }
    }
    
    console.log(`Currently deployed GTM version sha: ${active_revision.containers[0].image}`);
  
    const url = 'https://gcr.io/v2/cloud-tagging-10302018/gtm-cloud-image/tags/list';

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let image_manifest = await response.json();
    image_manifest = image_manifest.manifest;

    let stable_image_key = null;
    for (const release in image_manifest) {
        if (Array.isArray(image_manifest[release].tag) && image_manifest[release].tag.includes('stable')) {
            stable_image_key = release;
            break; 
        }
    }

    console.log(`Latest stable sha: ${stable_image_key}`);

    if(stable_image_key.split(":")[1] != active_revision.containers[0].image.split(":")[1]) {
        console.log(`Versions are different: Deploying a new revision to catch latest stable image: ${stable_image_key.split(":")[1]}`);
    
        const service = {
            "name": `projects/${params.project_id}/locations/${params.region}/services/${params.service_name}`,
            "template":{
                "containers":[
                    {
                        "image": "gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable",
                        "env": active_revision.containers[0].env,
                        "resources": active_revision.containers[0].resources,
                        "livenessProbe": active_revision.containers[0].livenessProbe,
                        "startupProbe": active_revision.containers[0].startupProbe,
                    }
                ]
            }
        };

        const revision_request = {
            service,
        };
  
        const [operation] = await service_client.updateService(revision_request);
        const [revision_response] = await operation.promise();
      
        return res.status(200).json({
            "status":"updated successfully",
            "gtm-version":revision_response.template.containers[0].image.split(":")[1],
            "latest-image-version": stable_image_key.split(":")[1] 
        });
    }   
   
    return res.status(200).json({
        "status":"no update needed",
        "gtm-version":active_revision.containers[0].image.split(":")[1],
        "latest-image-version": stable_image_key.split(":")[1] 
    });
  }
});
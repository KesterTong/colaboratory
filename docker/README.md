#CoLaboratory on Docker
##Overview
CoLaboratory includes a Dockerfile for creating an automated build of coLaboratory, including many standard Python libraries.  We use the Docker automated build system, so that in image built from the lastest version from this repository is always available at https://registry.hub.docker.com/u/jupyter/colaboratory/.

It is important to note that this built is experimental, and not designed work as a web service out of the box.  What the Docker instance does provide, is a way to easily set up Docker on a server, in a manner that is no more (or less) secure than running coLaboratory in localhost on your own machine.  We recommend that unless you have some knowledge of security issues, you treat this server like you would treat your own machine, i.e. connect via ssh (with port forwarding on port 8844 to connect to the kernel).

In general, it is important to note the following things:

 * Running coLaboratory as a specific user, will allow *any* users to execute code as that user, using the IPython kernel, unless specific steps are taken to prvent this.  Therefore **you should only run the Docker image under an account that is shared by all users**.

 * If you expose the port the coLaboratory listens on (in this case 8844) to the web, then any user on the internet will be able to execute code, which is almost certainly not what you want.  Therefore, unless you know what you are doing **you should connect using SSH port forwarding, not by exposing port 8844 to the open web**.

## Installing on Specific Platforms

### Google Compute Engine
This section assumes you already have a Google Cloud account.  To setup you own computer,   
  1. Install the [Google Cloud SDK](https://developers.google.com/compute/docs/gcutil/)
  2. Set up authorization by running ```$ gcloud auth login``` on the command line.
  3. Set Cloud Console Project to any project you own by running ```$ gcloud config set project [my-project-name]```

####Creating an Instance
To create a Google Compute Engine instance running the docker image, first download the file ```manifest.yaml``` from this [link](https://github.com/KesterTong/colaboratory/blob/gcedocs/docker/manifest.yaml).  From the directory where you downloaded ```manifest.yaml``` to, run the command

```
gcloud compute instances create [instance-name] \
  --metadata-from-file google-container-manifest=manifest.yaml \
  --scopes bigquery storage-ro \
  --image-project google-containers \
  --image container-vm-v20140522 \
  --zone us-central1-a \
  --machine-type n1-standard-1
```
The ```--scopes``` param indicates that permissions for the default service account.  This service account can be used by all users logged into the instance.  This must be run from the directory that contains manifest.yaml.

Setup takes around 5 minutes.

####Logging on
In order to have access to this instance from your own computer, you need to ssh into GCE with port forwarding.  This allows you to access the port that coLaboratory listens on, from your own machine.  To do this, run the command
```
gcutil ssh --ssh_arg "-L 8844:127.0.0.1:8844" [instance-name]
```

Then from your browser, navigate to  ```http://127.0.0.1:8844/welcome```

####Authentication for Calling Cloud Services from coLaboratory
When running the Docker instance, users can use the OAuth credentials associated with the default service account.  This means that Google Cloud Services can be accessed without doing any other authentication, because the cloud instance itself already contains these credentials.

Using default service account credentials is done as follows
```
from oauth2client.gce import AppAssertionCredentials
# Get token with scope bigquery
credentials = AppAssertionCredentials('bigquery')
# Use credentials with pandas BigQuery connector
from pandas.io.gbq import (GbqConnector, read_gbq)
# Override CbqConnector.get_credentials method
GbqConnector.get_credentials = lambda _: credentials
# Call read_gbq method, using project_id for the BigQuery project
read_gbq('SELECT corpus FROM publicdata:samples.shakespeare GROUP BY corpus', project_id='colab-sandbox')
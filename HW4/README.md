# HW4
CSC 519 - DevOps HW4

[Screencast](https://youtu.be/bG5nfj_1lI0)

### Commands 
```
Bring up Gateway 
- node main.js 

Bring up Ratings Server 
- node ratings.js 

Test the Gateway API for 100 experiments 
- node test.js 

Automated test to check if errors in Ratings service are handled gracefully 
- node automated_test.js
```

### Implementation 
```
I split the implementation into 4 files 
1. main.js - includes the code for the gateway and api routes 
2. ratings.js - contains the server and routes for ratings 
3. test.js - contains the code which checks the routes for their status codes, and outputs them on standard output. (The results of my experiment are in /output folder)
4. automated_test.js - NodeJS script which checks the html status code for all API endpoints, with the ratings server either up or down. If there is a "FAILED" keyword in standard output, then it means some API endpoint is not handling failures gracefully.

I stored all the output for my experiments in /output folder. 
I tried to follow the naming convention - n_<number of experiments>_p_<prob of api route><prob of api_control route><prob of api_exp route>

The ratings server is hosted on http://localhost:5000/ratings URL.
The /api and /api_control routes redirect to the above URL, which always ends in a status 200 HTML code. 

To simulate the server going down, I am redirecting /api_exp route to an invalid URL (http:localhost:6000), which does not exist. The URL request would throw a status 404 (Not Found) in this case. 
I catch the error, and display a status 500 (Internal Server Error) on the page. 

The /api_exp route can be modified to return any other status code. (Or even a status 200 with a regret message.) This is ultimately a design decision, based on the level of grace you require while handling errors. 
```

### Observations
```
1. For 100 itertions, with the probabilities given in the example, the gateway was rarely getting routed to /api_exp route. This makes sense because a probability of 0.5% is way too less for the experiment size. Such low levels of probability will only make sense for real-time applications (like Netflix), where the number of requests are in the order of thousands (or more) an hour. 

2. Thus, to check my experimental setup, I ran the code again for 300 itertions, with the same probability. I was luckily able to get 3 redirects to /api_exp route, which ended in a 500 status code. I ran the experiment multiple times, and did not observe a status 404 (or any other invalid error codes.)

3. Next I increased the probability for /api_exp route to about 12.5%, and ran the experiment for 100 iterations. I got about 11 redirects to the experimental cluster, which resulted in a status 500 HTML code. 

4. For the automated testing part, I validate if the API endpoints return the right status code. (When the ratings service is up, and down). Based on my experiment setup, I can check 6 different combinations 

	- /api (ratings service up)
	- /api (rating service down) [EXCLUDED]
	- /api_control (ratings service up)
	- /api_control (rating service down) [EXCLUDED]
	- /api_exp (ratings service up)
	- /api_exp (rating service down)

Out of this, I excluded the two mentioned above, since they do not have the code to handle errors in ratings service gracefully. 

I verified with the included combinations, the script passes. 
If I include any of the excluded ones, the script will fail. 
It is fairly conclusive to test automatically. 

In a real-life scenario, I may have to modify the code to bring up/down the ratings service. 
Right now, I implemented it as a simple node service. 
```

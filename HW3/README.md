# HW3 

## [Screencast](https://youtu.be/sd29WRhVK9o)

- Describe some benefits and issues related to using Feature Flags.
```
Benefits : 
1. It is easier to revert changes in case of unexpected behaviour
2. It allows experimentations on the Software. Developers can hide their features from the customers, but still collect data on it as a background process. 
3. It allows flexibility in terms of what features you want to enable for a customer. You can additionally charge the customer accordingly. 
```
```
Issues : 
1. We need to keep the functionality of the features independent of the main source code, or other features. Often, the code gets complicated, and it introduces dependencies, and bugs between features. 
2. What number of feature flags in a Software is TOO MANY feature flags? Maintaining feature flags beyond a point becomes a task in itself 
3. Users might use the features differently than DEV expected 
4. It is impractical to test all permutations of activated feature flags! (It is highly important that the features are independent of each other)
```
- What are some reasons for keeping servers in seperate availability zones?
```
1. The servers in separate availablity zones are isolated from each other. So failure in one, will not impact the other. We essentially have a backup server, if anything goes wrong in one server. 
2. While deploying a new version, we can do it on one server, and revert traffic to the other, in case of failures. 
3. If the servers are geographically apart too, then they will distribute traffic more efficiently. Users can be routed to the server which is closest to them. 
4. The primary reason is to ensure availability of your service/application. 
```

- Describe the Circuit Breaker pattern and its relation to operation toggles.
```
Circuit Breaker pattern is a Software Engineering methodology used to avoid cascading failures in a system. 
Often, when a service call fails, the subsequent calls on the system will also fail. 
The bad part here, is that these failures will consume the critical resources of the system, and possibly bring down other servers in a cascading fashion. 

The solution is to wrap a server in a protective module, which monitors the number of failues on the system. 
Once the failure count exceeds the threshold, all further calls fails automatically, and are not addressed. 
This avoid cascading failures, but requires a manual intervention to reset the system, once all is well again. 

Operation toggles can produce similar unexpected behaviour, which might bring down the whole infrastructure. 
There might be numerous operation toggles per day, and it is near impossible to ensure that all of the operation combinations work perfectly. 
Circuit breakers come into play, if the configuration you're using is causing failures, and gives the developer some time to revert back to a stable configuration, and reset the system. 
```

- What are some ways you can help speed up an application that has
	+ traffic that peaks on Monday evenings
	```
	1. Auto scaling : Use IAAS services like AWS which lets you scale up the number of servers automatically on detecting traffic. Further, you may be able to schedule the increase in number of servers on a particular day on the system 
	2. Invest in a good load-balancer server, so that each of your available servers are used optimally, and none of them are over loaded
	```
	+ real time and concurrent connections with peers
	```
	1. Use in-memory caches like Redis to get your data. It can save up time from querying the database on each request. 
	2. User the fastest network possible, and maybe use faster information exchange protocols. 
	```
	+ heavy upload traffic
	```
	1. Have servers in different geographical locations, based on your concentration of users. This will reduce the latency for each user. You may disseminate the uploaded data to other servers conveniently during off-peak hours, or as a regular cronjob. 
	2. Utilize smaller atomic parts in the job, so that in case of failures, we don't need to start from scratch again
	```

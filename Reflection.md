# Reflection

## LLMs/Agentic Coding tools

I used the Context tool for the backend along with ChatGPT to debug very small specific test cases, and Copilot + Cursor for the frontend and further debugging on the backend during the frontend implementation phase. They were very easy to use, but I found that they were really only effective if you had a clear idea of the overall design beforehand in order to make detailed prompts so that the LLM doesn’t have to infer anything (which was often where a lot of my bugs came up)

## Backend Process

I think the idea of modular backend concepts that are linked by syncs is a very clean way to design and implement a website that is very very LLM friendly. I found that how detailed I made my concept specification directly correlated with the quality of the code that the LLM generated for me. I felt SO much satisfaction when the Context tool was able to generate a working implementation with complete testing and thorough edge case handling in one prompt.

My workflow for implementing each concept was as follows:

1. I consider the syntax, functionality, and correctness of actions and state of the concept specification, making changes manually or with the help of the LLM
2. I use the final concept specification as context for the implementation, and use `./ctx prompt` to continuously modify the implementation
3. Once I'm satisfied with the implementation, I use it and the concept specification to run `./ctx prompt` to generate a testing file, making sure that it tests all actions/operational principle
4. I copy the implementation and test code over into TypeScript files to debug them and modify them so that they are passing the tests
5. I modify the test output to be more legible and better highlight the operational principle, and clearly show that it tests all components of the operational principle

## Frontend Process

I found that writing one long prompt to handle consistency in design on the frontend was the easiest way to tackle things, which is not very incremental, but I did test each UI component along with its associated backend functionality incrementally, which allowed my frontend implementation process to stay clean.

This ‘one long prompt’ consisted of the key features of my app that I wrote about in assignment 2, to give context, and then I basically wrote a 5 paragraph essay detailing the positioning of elements and UI details of page layouts and how they link to each other, following the sketches made in assignment 2. I also included details of how UI elements corresponded to backend concepts. This allowed the LLM to generate an entire working frontend in one shot, that I incrementally debugged/added functionality to.

In making color/design changes, I just gave the colors in the palette I chose, and vaguely described the style of the UI I wanted (“playful, game-inspired design”). The process was super easy, and I only had to do a bit of cleanup to make text more readable or resize elements on the page.

I provided names to google fonts and listed what kinds of fonts different UI elements, like buttons or headers, should use. This allowed me to experiment with different fonts very easily as well.

## Lessons

I learned that you need to be more precise with requirements in concept spec and invariants so that there aren’t too many bugs and edge cases to catch while testing the frontend. All of my difficulty came from not catching edge cases.
Some of the edge cases I didn’t catch on the backend that ended up affecting my making frontend implementation more difficult is enforcing deduplication and handling invalid inputs.

Another point of difficulty came from the fact that one of my syncs, which triggers multiple actions across different concepts, had to be scheduled daily at midnight, and the actions had to sort of occur in a chain, with one result being the input to the next. On the frontend, this was easy to implement (although a global scheduled update can’t really occur on the frontend), but when moving it to the backend, I was completely at a loss of how to turn this into a sync. After a long back-and-forth with Cursor (it went through multiple implementations that I rejected), based on all the feedback I gave, it implemented multiple syncs that link each action together, so that I ended up with a chain of multiple syncs that triggered each other, which I felt was a good design.

Overall the skill I acquired from this is being able to conceptually think about a website in terms of modular components, which makes all the complicated relations much easier to reason about as a whole. Being able to write down an entire specification for a website, with detailed consideration of edge cases and invariants, makes it very safe for an LLM to implement, and also really allows you to focus on designing for correctness instead of getting hung up on code syntax and lower-level implementation details.

I also learned about how to protect data by moving it from the frontend to the backend through syncs, which allow API routes to not return a response unless there is code on the backend explicitly handling the request made and returning the response, so that the returned information cannot be requested publicly.

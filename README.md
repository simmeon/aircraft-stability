# Aircraft Stability Visualiser

This interactive web-based tool visualises the longitudinal dynamics of an aircraft in real time. It is designed to help students, engineers, and enthusiasts build an intuitive understanding of how the stability derivatives affect an aircraft's stability and dynamic response.

**Find it online here:** [https://simmeon.github.io/aircraft-stability/](https://simmeon.github.io/aircraft-stability/)

---

## Purpose

When deriving and linearising aircraft equations of motion -- in particular with the forces and moments -- a common method results in us having coefficients like `Cm_α`, `CL_α`, and `Cm_q`. These ***stability derivatives*** represent partial derivatives evaluated at some reference condition and are critical to understanding flight dynamics, stability, and how to control an aircraft. But it might not be clear how exactly they affect the stability of an aircraft. 

This tool has been designed to help visualise the equations and make the effects of each stability derivative more concrete.


Users can:
- 🔧 Adjust key aerodynamic derivatives using sliders.
- 📉 Watch how the system poles (eigenvalues) move on the complex plane.
- 📈 Observe how the aircraft's time-domain response changes.
- 🔁 Switch between multiple steady-state reference conditions.
- 🛩️ View a simplified aircraft illustration responding in real time.


---

## Getting Started

### Requirements

- An internet connection! Visit [https://simmeon.github.io/aircraft-stability/](https://simmeon.github.io/aircraft-stability/) on any device to use this tool.

### Usage

- Visit [https://simmeon.github.io/aircraft-stability/](https://simmeon.github.io/aircraft-stability/)
- Perturb the system by holding down **Deflect Elevator**.
- Use the sliders to change the stability derivatives, changing the aircraft behaviour.
- Watch the charts and aircraft respond in real time.
- Switch steady state reference conditions and see how stability is affected.

## References

A collection of flight dynamics and control references I have found useful is written here to hopefully steer you in the right direction and save you some time if you want to learn more.

### Jan Roskam - Airplane Flight Dynamics and Automatic Flight Controls
A great book that derives each stability and control derivative in detail. The derivatives used in this tool are from Appendix B1 (2001 edition, specifically). It also has a good and clear derivation of linearising the equations of motion using perturbation theory. One of my top two flight dynamics references.

### Stevens & Lewis - Aircraft Control and Simulation
The clearest and most complete derivation of the full non-linear equations of motion. Out of every textbook I have read, this has my favourite style of notation, being explicitly clear about what each vector represents (although it's not perfect). I find the linearisation of the equations less clear and the explanation of the stability and control derivatives is not as good as Roskam. However, it is still one of my top two flight textbooks. The control content is also good.

### Videos - Christopher Lum
Christopher Lum has some great videos on flight dynamics, in particular on deriving the non-linear equations of motion. I remember watching this video was the first time it all really clicked for me: [The Flat Earth Equations of Motion](https://www.youtube.com/watch?v=JhwYe7kOJPI).

### Videos - Steve Brunton
Steve Brunton has a huge amount of knowledge and explanatory videos with a focus on control. I would recommend his [Control Bootcamp](https://www.youtube.com/playlist?list=PLMrJAkhIeNNR20Mz-VpzgfQs5zrYi085m) to help you if it's been a while since you've done control. He also has plenty of other maths and control videos if jumping straight into that is a bit much.

### Videos - Brian Douglas
Brian Douglas has a lot of really good videos covering a wide range of control theory. These are a great way to understand the bigger picture ideas and reasoning without getting lost in the complex mathematics that is often involved in control. He has videos on [his own channel](https://www.youtube.com/@BrianBDouglas) and lots more on the MATLAB channel as MATLAB tech talks, such as this series on [state spaces](https://www.youtube.com/playlist?list=PLn8PRpmsu08podBgFw66-IavqU2SqPg_w).

### Honorable Mentions
At this point it feels like there are countless textbooks and references I've used for flight mechanics and control. A few more that seem to come up often for me are:

- Bernard Etkin - Dynamics of Flight - Stability and Control
- Duane McRuer - Aircraft Dynamics and Automatic Control
- Robert Nelson - Flight Stability and Automatic Control
- Mark Tischler - Aircraft and Rotorcraft System Identification (for those who are curious about how we might come up with the values for these derivatives from real flight data... and want a challenge)

All have certain good and useful parts. A key thing to keep in mind while learning about this subject is that everyone does things slightly differently. Try not to get stuck with just one textbook and one explanation for things. This is a *very* confusing area and the best way to understand things fully is to approach it from the perspective of multiple different people. 

***Find what makes sense to you, be curious, and question everything.***




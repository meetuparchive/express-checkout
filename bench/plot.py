import matplotlib.pyplot as plt
import numpy as np

BAR_WIDTH = 0.25

def plot(data):
	with plt.xkcd():
		fig, axes = plt.subplots(figsize=(6,4))
		axes = plt.subplot(1, 1, 1)
		axes.set_title("checkout time (~4.5 GB Repository)")
		indices = np.arange(len(data))
		axes.set_xticks(indices)
		axes.set_xticklabels(data.keys())
		for i, (name, time) in enumerate(data.items()):
			color = "#fe4ed8" if name == "meetup/express-checkout@v1" else "#0809fe"
			axes.bar(i, time, BAR_WIDTH, color=color)
		plt.tight_layout()
		plt.savefig('../demo.png')


if __name__ == "__main__":
	plot({
		"actions/checkout@v1": 6.32,
		"meetup/express-checkout@v1": 1.2
	})
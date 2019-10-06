<div align="center">
  💳 :octocat:
</div>
<h1 align="center">
  express checkout
</h1>

<p align="center">
   A GitHub Actions checkout action that's fast for git repositories of all shapes and sizes
</p>

<div align="center">
  <img src="demo.png"/>
</div>

<div align="center">
  <a href="https://github.com/meetup/express-checkout/actions">
		<img src="https://github.com/meetup/express-checkout/workflows/Main/badge.svg"/>
	</a>
</div>

<br />

> **⚠️ Note:** To use this action, you must have access to the [GitHub Actions](https://github.com/features/actions) feature. GitHub Actions are currently only available in public beta. You can [apply for the GitHub Actions beta here](https://github.com/features/actions/signup/).

## Fast you say?

Unfortunately, not all code repositories are small. For organizations that structure code within mono repositories, you can find yourself in situations where simply cloning your repository can become an obstical for fast continuous integration. In a stateless and serverless continous integraion system like GitHub Actions you want this to be as fast as possible. That is the goal of this GitHub action.

We quick realized this with some of our most important repositories when trialing GitHub actions, the default checkout action was less than ideal.

```yaml
name: CI
jobs:
  test:
    steps:
      - uses: actions/checkout@v1
        with:
          fetch-depth: 1
```

Would take upwards of 6 to 7 minutes _before_ CI could do anything useful. With express-checkout, we've got that down to 1.

## usage

```yaml
name: CI
jobs:
  test:
    steps:
      - name: Checkout
        uses: meetup/express-checkout@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Test
        run: echo ⭐ ⭐ ⭐
```

Meetup Inc 2019

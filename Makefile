.PHONY: all clean

BUILD_MSG = echo -e "\033[34mBUILD\033[0m  $@"
CLEAN_MSG = echo -e "\033[34mCLEAN\033[0m  dist"

CHALLENGES = $(subst src/,dist/,$(wildcard src/challenges/*.json))
MEDIA = $(subst src/media/,dist/,$(wildcard src/media/*))

all: dist/index.html dist/script.js dist/notation.js dist/style.css dist/COPYING
all: $(MEDIA) $(CHALLENGES) dist/challenge_index.json

dist/script.js: $(wildcard src/js/*)
	@$(BUILD_MSG)
	@mkdir -p dist
	@./node_modules/.bin/babel src/js --no-comments | cat src/license-header.txt - > dist/script.js

dist/notation.js: $(wildcard src/notation/*)
	@$(BUILD_MSG)
	@mkdir -p dist
	@node src/notation/build.js | cat src/license-header.txt - > dist/notation.js

dist/style.css: $(wildcard src/scss/*)
	@$(BUILD_MSG)
	@mkdir -p dist
	@./node_modules/.bin/node-sass --quiet --output-style compressed -o dist src/scss/

dist/index.html: src/index.html
	@$(BUILD_MSG)
	@mkdir -p dist
	@cp -f $^ $@

dist/COPYING: COPYING
	@$(BUILD_MSG)
	@mkdir -p dist
	@cp -f $^ $@

dist/challenge_index.json: $(CHALLENGES)
	@$(BUILD_MSG)
	@mkdir -p dist
	@node src/challenges/build_index.js > $@

dist/challenges/%: src/challenges/%
	@$(BUILD_MSG)
	@mkdir -p dist/challenges
	@cp -f $^ $@

dist/%: src/media/%
	@$(BUILD_MSG)
	@mkdir -p dist
	@cp -f $^ $@

clean:
	@$(CLEAN_MSG)
	@rm -rf dist

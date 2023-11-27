import { getArticleTitle } from "../wikipediaAPI/util.js";
import { fetchJson } from "../fetch.js";
import { PromptGenerator } from "../generator.js"
import { AutocompleteInput } from "../autocomplete.js";

var MarathonBuilder = {

    props: ['admin'],

    components: {
        'prompt-generator': PromptGenerator,
        'ac-input': AutocompleteInput
    },

    data: function() {
        return {
            start: "United States",
            startcp: [],
            cp: [],
            seed: "0",
            anonymous: true,
            placeholder: "",
            articleCheckMessage: "",
            language: "en",
        }
    },

    methods: {

        async generateRndPrompt(prompt) {
            [this[prompt]] = await this.$refs.pg.generatePrompt();
        },

        submitPrompt: async function() {

            try {
                if (this.startcp.length != 5) throw new Error("Need exactly 5 starting checkpoints. Add or remove starting checkpoints");
                if (this.cp.length < 40) throw new Error("Need 40 or more reserve checkpoints. Add more reserve checkpoints");

                if (this.admin) {
                    await this.submitAsAdmin();
                } else {
                    await this.submitAsCmty();
                }
            } catch (e) {
                this.articleCheckMessage = e
                console.log(e);
            }
        },

        submitAsAdmin: async function() {
            const response = await fetchJson("/api/marathon/add/", 'POST', {'data': this.$data })
            if (response.status != 200) {
                // For user facing interface, do something other than this
                alert(await response.text());
                return;
            }
            this.articleCheckMessage = "Prompt submit success. Refresh to see recently added prompt"
        },

        submitAsCmty: async function() {
            const response = await fetchJson("/api/community_prompts/submit_marathon_prompt", 'POST', {
                'data': this.$data,
                "anonymous": this.anonymous }
            )
            if (response.status != 200) {
                // For user facing interface, do something other than this
                alert(await response.text());
                return;
            }
            this.articleCheckMessage = "Prompt submitted for approval."
        },

        addArticle: async function(mode) {
            if (this.placeholder.length < 1) return;

            let a = await getArticleTitle(this.placeholder)

            if (this.cp.includes(a) || this.startcp.includes(a) || this.start == a ) {
                this.articleCheckMessage = "Article already exists. "
                return
            }

            if (mode == 0) {
                this.start = a
            } else if (mode == 1) {
                this.startcp.push(a)
            } else if (mode == 2) {
                this.startcp.unshift(a)
            } else if (mode == 3) {
                this.cp.push(a)
            } else if (mode == 4) {
                this.cp.unshift(a)
            }

            this.placeholder = ""
        },

        moveup: function (ind, mode) {
            if (ind == 0) return;
            if (mode == 0) {
                [this.startcp[ind-1], this.startcp[ind]] = [this.startcp[ind], this.startcp[ind-1]];
            } else if (mode == 1) {
                [this.cp[ind-1], this.cp[ind]] = [this.cp[ind], this.cp[ind-1]];
            }
            this.$forceUpdate();
        },

        movedown: function (ind, mode) {
            if (mode == 0) {
                if (ind == this.startcp.length-1) return;
                [this.startcp[ind], this.startcp[ind+1]] = [this.startcp[ind+1], this.startcp[ind]];
            } else if (mode == 1) {
                if (ind == this.cp.length-1) return;
                [this.cp[ind], this.cp[ind+1]] = [this.cp[ind+1], this.cp[ind]];
            }
            this.$forceUpdate();
        },

        deleteA: function(ind, mode) {
            if (mode == 0) {
                this.startcp.splice(ind,1)
            } else if (mode == 1) {
                this.cp.splice(ind,1)
            }
            this.$forceUpdate();
        },

        loadGeneric: async function() {
            while (this.cp.length < 40) {
                this.placeholder = String(this.cp.length)
                await this.addArticle(3)
            }
            while (this.startcp.length < 5) {
                this.placeholder = String(this.startcp.length + 40)
                await this.addArticle(1)
            }
        }, 

        clear: function() {
            this.start= "United States"
            this.startcp= []
            this.cp= []
            this.seed= "0"
            this.placeholder= ""
        }
    },

    mounted: function() {
        let input = document.getElementById("inputField");
        input.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.getElementById("addInputToCPEnd").click();
            }
        });
    },

    template: (`
        <div class="row">
            <div class="col-sm">
                <div>Starting Article: <strong>{{start}}</strong></div>
                <div class="my-2">Starting Checkpoints:
                    <table class="table">
                        <tbody>
                            <tr v-for="(item, index) in startcp" v-cloak>
                                <td style="padding: 0 !important">{{index + 1}}.</td>
                                <td style="padding: 0 !important"><strong>{{item}}</strong></td>
                                <td style="padding: 0 !important; text-align:right">
                                    <button class="btn quick-play" v-on:click="moveup(index, 0)"><i class="bi bi-chevron-up"></i></button>
                                    <button class="btn quick-play" v-on:click="movedown(index, 0)"><i class="bi bi-chevron-down"></i></button>
                                    <button class="btn quick-play" v-on:click="deleteA(index, 0)"><i class="bi bi-trash"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="my-2">Reserve Checkpoints (In order):
                    <table class="table">
                        <tbody>
                            <tr v-for="(item, index) in cp" v-cloak>
                                <td style="padding: 0 !important">{{index + 1}}.</td>
                                <td style="padding: 0 !important"><strong>{{item}}</strong></td>
                                <td style="padding: 0 !important; text-align:right">
                                    <button class="btn quick-play" v-on:click="moveup(index, 1)"><i class="bi bi-chevron-up"></i></button>
                                    <button class="btn quick-play" v-on:click="movedown(index, 1)"><i class="bi bi-chevron-down"></i></button>
                                    <button class="btn quick-play" v-on:click="deleteA(index, 1)"><i class="bi bi-trash"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col-sm">
                <div class="row">
                    <div class="col-sm mb-2">
                        <div class="input-group flex-nowrap">
                            <ac-input :text.sync="placeholder" :lang="language" placeholder="Article" id="inputField"></ac-input>
                            <button type="button" class="btn border quick-play" @click="generateRndPrompt('placeholder')">
                                <i class="bi bi-shuffle"></i>
                            </button>
                        </div>
                    </div>
                    <!--<div class="col-sm mb-2">
                        <div class="input-group flex-nowrap">
                            <input class="form-control" type="text" name="seedField" v-model="seed">
                        </div>
                    </div>-->
                    <p v-if="articleCheckMessage" class="text-danger mb-0">{{articleCheckMessage}}</p>
                </div>

                <div class="gap-2 d-flex justify-content-center justify-content-md-start my-3">
                    <button class="btn quick-play" v-on:click="addArticle(0)">Set start</button>
                </div>
                <div class="gap-2 d-flex justify-content-center justify-content-md-start my-3">
                    <button class="btn quick-play" v-on:click="addArticle(1)">Add to starting checkpoints</button>
                </div>
                <div class="gap-2 d-flex justify-content-center justify-content-md-start my-3">
                    <button class="btn quick-play" v-on:click="addArticle(3)" id="addInputToCPEnd">Add to END of checkpoints</button>
                </div>
                <div class="gap-2 d-flex justify-content-center justify-content-md-start my-3">
                    <button class="btn quick-play" v-on:click="addArticle(4)">Add to START of checkpoints</button>
                </div>
                
                <div class="form-check" v-if="!admin">
                    <label class="form-check-label">
                        <input class="form-check-input" type="checkbox" v-model="anonymous">
                        Anonymous Submission
                    </label>
                </div>

                <div class="gap-2 d-flex justify-content-center justify-content-md-start my-3">
                    <button type="button" class="btn quick-play" v-on:click="submitPrompt">Submit</button>
                    <button type="button" class="btn quick-play" v-on:click="loadGeneric" v-if="admin">Load Example</button>
                    <button type="button" class="btn quick-play" v-on:click="clear">Clear All</button>
                </div>

                <details>
                    <summary>Random Article Generator Settings</summary>
                    <prompt-generator ref="pg"></prompt-generator>
                </details>

                <details class="my-2" v-show="!admin">
                <summary><strong>Prompt building tips: Marathon</strong></summary>
                <p>
                  Here are some tips for building a good marathon prompt - with a
                  higher likelihood of admin approval
                </p>
                <ol>
                  <li>
                    Smilar to sprint prompts,
                    <strong
                      >a good marathon prompt should be challenging, but still very
                      much possible.</strong
                    >
                  </li>
                  <li>
                    Each checkpoint reached gives a player 5 more clicks. So,
                    <strong
                      >the average distance between articles should be around 5
                      clicks</strong
                    >.
                  </li>
                  <li>
                    Compared to sprint prompts, marathons have a slower pace and
                    encourages a more thoughtful style of play. However, because of
                    limitations on number of links a player can use, having some
                    concept association between checkpoints is more important.
                  </li>
                  <li>
                    The starting checkpoints will all appear at once. Reserve
                    checkpoints will be presented to the player in the listed order.
                    Keep that in mind if you want to guide the player in a specific
                    direction.
                  </li>
                  <li>
                    <strong>Don't make it too easy!</strong> Players are expected to run out of
                    clicks in the middle of the game, so feel free to ramp up the
                    difficulty for some of the later reserve checkpoints >:)
                  </li>
                </ol>
              </details>
            </div>
        </div>
    `)
};

export {MarathonBuilder}
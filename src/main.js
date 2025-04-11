import { dialogueData, playerScaleFactor, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, autoAdjCamScale } from "./utils";

k.loadSprite("CharacterSpritesheet", "./CharacterSpritesheet.png", {
    sliceX: 3,
    sliceY: 4,
    anims: {
        "idle-down": 1,
        "walk-down": { from: 0, to: 2, loop: true, speed: 9 },
        "idle-side": 7,
        "walk-side": { from: 6, to: 8, loop: true, speed: 9 },
        "idle-up": 10,
        "walk-up": { from: 9, to: 11, loop: true, speed: 9 },
    },
});

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
    const mapData = await (await fetch("./map.json")).json();
    const layers = mapData.layers;

    const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

    //create player
    const player = k.make([
        k.sprite("CharacterSpritesheet", { anim: "idle-down" }),
        k.area({//add collision
            shape: new k.Rect(k.vec2(0, 10), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(playerScaleFactor),
        {
            speed: 400,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    //create boundaries
    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                const components = [
                    k.area({
                        shape: new k.Rect(k.vec2(52, 0), boundary.width, boundary.height),
                    }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ];

                if (boundary.name !== "resume") {//resume box should be overlapping not blocking player
                    components.push(k.body({ isStatic: true }));
                }

                map.add(components);

                if (boundary.name) {//if boundary is an object, active displaydialoge
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        displayDialogue(
                            dialogueData[boundary.name], //dialogueData[boundary.name],
                            () => (player.isInDialogue = false)
                        );
                    });
                }
            }
        }

        if (layer.name === "spawnpoints") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                    k.add(player);
                }
            }
        }
    }

    //camera
    autoAdjCamScale(k);

    k.onResize(() => {
        autoAdjCamScale(k);
    });

    k.onUpdate(() => {
        k.camPos(player.worldPos().x, player.worldPos().y - 100);
    });

    //control
    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        if (
            mouseAngle > lowerBound &&
            mouseAngle < upperBound &&
            player.curAnim() !== "walk-up"
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        if (
            mouseAngle < -lowerBound &&
            mouseAngle > -upperBound &&
            player.curAnim() !== "walk-down"
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "right";
            return;
        }

        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";
            return;
        }
    });

    function stopAnims() {
        if (player.direction === "down") {
            player.play("idle-down");
            return;
        }
        if (player.direction === "up") {
            player.play("idle-up");
            return;
        }

        player.play("idle-side");
    }

    k.onMouseRelease(stopAnims);


    //keyboard
    k.onKeyRelease(() => {
        stopAnims();
    });

    k.onUpdate(() => {
        if (player.isInDialogue) return;

        const movingRight = k.isKeyDown("d");
        const movingLeft = k.isKeyDown("a");
        const movingUp = k.isKeyDown("w");
        const movingDown = k.isKeyDown("s");

        let moveX = 0;
        let moveY = 0;

        if (movingRight) {
            moveX += 1;
        }

        if (movingLeft) {
            moveX -= 1;
        }

        if (movingDown) {
            moveY += 1;
        }

        if (movingUp) {
            moveY -= 1;
        }

        // Normalize diagonal movement speed
        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX = (moveX / length) * player.speed;
            moveY = (moveY / length) * player.speed;

            player.move(moveX, moveY);

            // Set direction and animation
            if (moveX !== 0) {
                player.flipX = moveX < 0;
                player.direction = moveX > 0 ? "right" : "left";
                if (player.curAnim() !== "walk-side") player.play("walk-side");
            } else if (moveY !== 0) {
                player.direction = moveY > 0 ? "down" : "up";
                const anim = moveY > 0 ? "walk-down" : "walk-up";
                if (player.curAnim() !== anim) player.play(anim);
            }
        }
    });

});




k.go("main");
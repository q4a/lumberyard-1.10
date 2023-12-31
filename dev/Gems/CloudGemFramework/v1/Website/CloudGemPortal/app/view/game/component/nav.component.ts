﻿import { Component, OnInit} from '@angular/core';
import { AwsService, Deployment } from 'app/aws/aws.service';
import { Clipboard } from 'ts-clipboard';
import { InnerRouterService } from "app/view/game/module/shared/service/index";
import { UrlService } from "app/shared/service/index"
import { Authentication } from "app/aws/authentication/authentication.class";

declare const toastr: any;

@Component({
    selector: 'cgp-nav',
    templateUrl: "app/view/game/component/nav.component.html",
    styleUrls: ["app/view/game/component/nav.component.css"]
})
export class NavComponent {
    projectName = "Cloud Canvas Project";
    nav = {
        "deploymentName": "",
        "projectName": this.aws.context.configBucket,
        "deployments": [],
        "username": ""
    }
    public isCollapsed: boolean = true;


    public constructor(private aws: AwsService, private router: InnerRouterService, private urlService: UrlService) {
        var username = this.aws.context.authentication.user.username;
        this.nav = {
            "deploymentName": "Loading...",
            "projectName": this.aws.context.project.name,
            "deployments": this.aws.context.project.deployments,
            "username": username.charAt(0).toUpperCase() + username.slice(1)
        }
        // Listen for the active deployment and the name when the nav is loaded.
        this.aws.context.project.activeDeployment.subscribe(activeDeployment => {
            if (activeDeployment) {
                this.nav.deploymentName = activeDeployment.settings.name;
            } else {
                this.nav.deploymentName = "No Deployments";
            }
        });
    }

    public onDeploymentClick(deployment: Deployment) {
        this.aws.context.project.setDeployment(deployment);
        this.nav.deploymentName = deployment.settings.name;
    }

    public raiseRouteEvent(route: string): void {        
        this.router.change(route);
    }

    signOut(): void {
        this.aws.context.authentication.logout();
    }

    public onShare() {
        let params = this.urlService.querystring ? this.urlService.querystring.split("&") : [];
        let expiration: string = String(new Date().getTime());
        for (var i = 0; i < params.length; i++) {
            var param = params[i];
            var paramParts = param.split("=");
            if (paramParts[0] == "Expires") {
                expiration = paramParts[1]
                break;
            }
        }

        if (expiration != null && Number(expiration) != NaN) {
            let expirationDate = new Date(0);
            expirationDate.setUTCSeconds(Number(expiration))
            let now = new Date()
            let expirationTimeInMilli = expirationDate.getTime() - now.getTime();

            if (expirationTimeInMilli < 0) {
                toastr.error("The url has expired and is no longer shareable.  Please use the Lumberyard Editor to generate a new URL. AWS -> Open Cloud Gem Portal", "Copy To Clipboard");
            } else {
                let minutes = Math.round(((expirationTimeInMilli / 1000) / 60));
                Clipboard.copy(this.urlService.baseUrl)
                toastr.success("The shareable Cloud Gem Portal URL has been copied to your clipboard. The URL will expire in " + minutes + " minute(s).", "Copy To Clipboard");
            }
        } else {
            toastr.error("The URL is not properly set. Please use the Lumberyard Editor to generate a new URL. AWS -> Open Cloud Gem Portal", "Copy To Clipboard");
        }
    }
}

import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Events } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// models
import { GroupModel } from '../../models/group';
// firebase
import * as firebase from 'firebase/app';
// utils
import { getFormatData } from '../../utils/utils';
// services
import { ChatManager } from '../../providers/chat-manager/chat-manager';
import { UserService } from '../../providers/user/user';


@Injectable()
export class GroupService {

  private BASE_URL_LEAVE_GROUP: string;
  observable: any;

  constructor(
    public http: Http,
    public events: Events,
    public chatManager: ChatManager,
    public userService: UserService
  ) {
    this.BASE_URL_LEAVE_GROUP = 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/';
    this.observable = new BehaviorSubject<boolean>(null);
    console.log('Hello GroupProvider Provider');
  }

  initGroupDetails(uidUser, uidGroup) {
    const tenant = this.chatManager.getTenant();
    const urlNodeContacts = '/apps/'+tenant+'/users/'+uidUser+'/groups/'+uidGroup;
    return firebase.database().ref(urlNodeContacts);
  } 

  loadGroupDetail(uidUser, uidGroup){
    console.log("loadGroudDetail: ", uidGroup);
    const userFirebase = this.initGroupDetails(uidUser, uidGroup);
    let that = this;
    userFirebase.on("value", function(snapshot) {
        let groupDetail = new GroupModel(snapshot.key, 0, '', [], '', '');        
        if (snapshot.val()){
          const group = snapshot.val();
          console.log("group:: ", group);
          groupDetail = new GroupModel(
            snapshot.key, 
            getFormatData(group.createdOn), 
            group.iconURL,
            that.getUidMembers(group.members), 
            group.name, 
            group.owner
          );    
        }
        console.log("loadGroupDetail: ", groupDetail);
        that.events.publish('loadGroupDetail:complete', groupDetail);
      });
  }


  leaveAGroup(uidGroup, uidUser): Observable<string> {
    const appId = this.chatManager.getTenant();
    const token = this.userService.returnToken();
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer '+token);

    const options = new RequestOptions({ headers: headers });
    const url = this.BASE_URL_LEAVE_GROUP + appId + '/groups/' + uidGroup + '/members/' + uidUser;
    console.log('url: ', url);
    const body = {
      'app_id': appId
    };
    console.log('------------------> options: ', options);
    console.log('------------------> body: ', JSON.stringify(body));
    return this.http
    .delete(url, options)
    .map(res => (res.json()));
   }


  
  getUidMembers(members): string[]{
    let arrayMembers = [];
    const memberStr = JSON.stringify(members);
    JSON.parse(memberStr, (key, value) => {
      arrayMembers.push(key);
    });
    return arrayMembers;
  }

}
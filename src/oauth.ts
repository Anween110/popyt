/* istanbul ignore file */
/* We ignore this file because OAuth endpoints are too taxing to test, they are instead manually tested. */

import YouTube, { YTComment, Channel, Playlist, Subscription } from '.'
import { CommentThreadData, SubscriptionData } from './constants'
import { GenericService } from './services'

/**
 * @ignore
 */
export class OAuth {
  public youtube: YouTube

  /**
   *
   * @param youtube The YouTube object to retrieve the token from.
   */
  constructor (youtube: YouTube) {
    this.youtube = youtube
  }

  private checkTokenAndThrow () {
    if (!this.youtube.accessToken) {
      throw new Error('Must have an access token for OAuth related methods')
    }
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Gets the authorized user's [[Channel]].
   * Last tested 03/06/2019 22:21. PASSING
   */
  // tslint:enable:no-trailing-whitespace
  public getMe (): Promise<Channel> {
    return GenericService.getItem(this.youtube, Channel, true) as Promise<Channel>
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Gets the authorized user's [[Subscription]]s.
   * Last tested 03/06/2019 23:20. PASSING
   * @param maxResults The maximum number of subscriptions to fetch.
   * Fetches 10 by default. Set to a value <=0 to fetch all.
   */
  // tslint:enable:no-trailing-whitespace
  public getMySubscriptions (maxResults: number = 10): Promise<Subscription[]> {
    return GenericService.getPaginatedItems(this.youtube, 'subscriptions', true, null, maxResults) as Promise<Subscription[]>
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Gets the authorized user's [[Playlist]]s.
   * Last tested 03/06/2019 23:23. PASSING
   * @param maxResults The maximum number of playlists to fetch.
   * Fetches 10 by default. Set to a value <=0 to fetch all.
   */
  // tslint:enable:no-trailing-whitespace
  public getMyPlaylists (maxResults: number = 10): Promise<Playlist[]> {
    return GenericService.getPaginatedItems(this.youtube, 'playlists:channel', true, null, maxResults) as Promise<Playlist[]>
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Post a [[Comment]] on a [[Video]] or [[Channel]] discussion.  
   * Last tested 03/04/2019 23:20. PASSING
   * @param text The text content of the comment.
   * @param channelId The channel to post the comment on.
   * @param videoId The video of the channel to post the comment on.
   * If falsey, the comment will be posted to the channel discussion.
   */
  // tslint:enable:no-trailing-whitespace
  public async postComment (text: string, channelId: string, videoId?: string): Promise<YTComment> {
    this.checkTokenAndThrow()

    if (text === undefined || text === null || text.trim() === '') {
      return Promise.reject('Invalid comment text')
    }

    const data: typeof CommentThreadData = JSON.parse(JSON.stringify(CommentThreadData))
    data.snippet.topLevelComment.snippet.textOriginal = text
    data.snippet.channelId = channelId

    if (videoId) {
      data.snippet.videoId = videoId
    }

    const result = await this.sendData('post', 'commentThreads', 'snippet', data)
    const type = result.snippet.channelId ? 'channel' : 'video'
    return new YTComment(this.youtube, result.snippet.topLevelComment, type)
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Edit a [[Comment]] on a [[Video]] or [[Channel]] discussion.  
   * Last tested 03/04/2019 23:20. PASSING
   * @param text The new text content of the comment.
   * @param commentId The ID of the comment.
   */
  // tslint:enable:no-trailing-whitespace
  public async editComment (text: string, commentId: string): Promise<YTComment> {
    this.checkTokenAndThrow()

    if (text === undefined || text === null || text.trim() === '') {
      return Promise.reject('Invalid comment text')
    }

    const data: typeof CommentThreadData = JSON.parse(JSON.stringify(CommentThreadData))
    data.snippet.topLevelComment.snippet.textOriginal = text
    data.id = commentId

    const result = await this.sendData('put', 'commentThreads', 'snippet', data)
    const type = result.snippet.channelId ? 'channel' : 'video'
    const comment = new YTComment(this.youtube, result.snippet.topLevelComment, type)

    if (result.replies) {
      result.replies.comments.forEach(reply => {
        const created = new YTComment(this.youtube, reply, type)
        comment.replies.push(created)
      })
    }

    return comment
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Subscribe to a [[Channel]].  
   * Last tested 03/04/2019 23:17. PASSING
   * @param channelId The channel to subscribe to.
   * @returns A partial subscription object.
   */
  // tslint:enable:no-trailing-whitespace
  public async subscribeToChannel (channelId: string): Promise<Subscription> {
    this.checkTokenAndThrow()

    if (channelId === undefined || channelId === null || channelId.trim() === '') {
      return Promise.reject('Invalid channel ID')
    }

    const data: typeof SubscriptionData = JSON.parse(JSON.stringify(SubscriptionData))
    data.snippet.resourceId.channelId = channelId

    const result = await this.sendData('post', 'subscriptions', 'snippet', data)
    return new Subscription(this.youtube, result)
  }

  // tslint:disable:no-trailing-whitespace
  /**
   * Unsubscribe from a [[Channel]].  
   * Last tested 03/04/2019 23:17. PASSING
   * @param channelId The channel to unsubscribe from.
   */
  // tslint:enable:no-trailing-whitespace
  public async unsubscribeFromChannel (subscriptionId: string): Promise<void> {
    this.checkTokenAndThrow()

    if (subscriptionId === undefined || subscriptionId === null || subscriptionId.trim() === '') {
      return Promise.reject('Invalid subscription ID')
    }

    await this.youtube._request.delete('subscriptions', { id: subscriptionId }, this.youtube.accessToken)
  }

  private sendData (type: 'post' | 'put', endpoint: string, part: string, data: any) {
    return this.youtube._request[type](endpoint, { part }, this.youtube.accessToken, JSON.stringify(data))
  }
}
